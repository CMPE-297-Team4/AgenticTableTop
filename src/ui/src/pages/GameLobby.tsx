import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FantasyButton } from "@/components/FantasyButton";
import { FantasyCard, FantasyCardContent, FantasyCardDescription, FantasyCardHeader, FantasyCardTitle } from "@/components/FantasyCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Sword,
  Shield,
  Scroll,
  UserPlus,
  LogIn,
  Gamepad2,
  Users,
  User,
  Plus,
  Search,
  Play,
  ArrowLeft,
  Copy,
  Share2,
  Check,
  LogOut,
  Library,
  Home,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  listSessions,
  listUserCampaigns,
  listCharacters,
  createSession,
  getSessionByInvite,
  joinSessionByInvite,
  generateCampaign,
  type GameSession,
  type Campaign,
  type PlayerCharacter,
  type CampaignRequest,
} from "@/services/campaignApi";
import { campaignTemplates } from "@/data/campaignTemplates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const GameLobby = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, login: authLogin, register: authRegister, logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{
    id: number;
    title: string;
    theme: string;
    background: string;
    created_at: string | null;
    updated_at: string | null;
  }>>([]);
  const [characters, setCharacters] = useState<PlayerCharacter[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedInviteSession, setSelectedInviteSession] = useState<GameSession | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"join" | "create" | "invite">("join");
  const [newSession, setNewSession] = useState({
    session_name: "",
    campaign_id: 0,
    character_ids: [] as number[],
  });
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaignOutline, setNewCampaignOutline] = useState("");
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [newCampaignDifficulty, setNewCampaignDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Deadly'>('Medium');
  const [newCampaignTemplate, setNewCampaignTemplate] = useState<string>("");

  useEffect(() => {
    if (isAuthenticated) {
      loadGameData();
      
      // Check if there's a new campaign ID from campaign creation
      const newCampaignId = sessionStorage.getItem("newCampaignId");
      if (newCampaignId) {
        // Auto-open create dialog and pre-select the campaign
        setCreateDialogOpen(true);
        setNewSession(prev => ({ ...prev, campaign_id: parseInt(newCampaignId) }));
        sessionStorage.removeItem("newCampaignId");
      }
    }
  }, [isAuthenticated]);

  const loadGameData = async () => {
    setLoadingData(true);
    try {
      const [sessionsData, campaignsData, charactersData] = await Promise.all([
        listSessions(),
        listUserCampaigns(),
        listCharacters(),
      ]);
      setSessions(sessionsData);
      setCampaigns(campaignsData);
      setCharacters(charactersData);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load game data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    if (isRegister) {
      if (!email.trim()) {
        setError("Please enter your email");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        await authRegister(username, email, password);
        // After successful registration, switch to login tab so user can log in
        setIsRegister(false);
        setError(""); // Clear any previous errors
        // Pre-fill username for convenience
        // Password is already filled
      } else {
        await authLogin(username, password);
        // After login, user is automatically a player - no role selection needed
      }
    } catch (err) {
      let errorMessage = "Authentication failed";
      if (err instanceof Error) {
        errorMessage = err.message;
        // Check if it's a connection error
        if (errorMessage.includes("Cannot connect to backend") || errorMessage.includes("Failed to fetch")) {
          errorMessage = "Cannot connect to server. Please make sure the backend is running at " + (import.meta.env.VITE_API_URL || "http://localhost:8000");
        }
      }
      setError(errorMessage);
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignOutline.trim()) {
      toast({
        title: "Error",
        description: "Please enter a campaign outline",
        variant: "destructive",
      });
      return;
    }

    setCreatingCampaign(true);
    try {
      const request: CampaignRequest = {
        outline: newCampaignOutline,
        force_new: true,
        difficulty_level: newCampaignDifficulty,
      };
      const campaign = await generateCampaign(request);
      toast({
        title: "Success!",
        description: `Campaign "${campaign.title}" created successfully!`,
      });
      await loadGameData();
      // Auto-select the newly created campaign
      setNewSession({ ...newSession, campaign_id: campaign.id || 0 });
      setNewCampaignOutline("");
      setNewCampaignTemplate("");
      setNewCampaignDifficulty('Medium');
      setShowCreateCampaign(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.session_name || !newSession.campaign_id || newSession.character_ids.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select at least one character",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const session = await createSession(newSession);
      toast({
        title: "Success!",
        description: session.invite_code 
          ? `Session created! Invite code: ${session.invite_code}` 
          : "Session created successfully",
      });
      setCreateDialogOpen(false);
      setNewSession({ session_name: "", campaign_id: 0, character_ids: [] });
      loadGameData();
      // Auto-join the newly created session
      setTimeout(() => {
        handleJoinSession(session.id);
      }, 500);
    } catch (error: any) {
      let errorMessage = "Failed to create session";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.detail) {
        errorMessage = error.detail;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = (sessionId: number) => {
    navigate(`/game-session/${sessionId}`);
  };

  const handleCopyInviteCode = async (inviteCode: string) => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy invite code",
        variant: "destructive",
      });
    }
  };

  const handleShareInvite = async (inviteCode: string, sessionName: string) => {
    const inviteUrl = `${window.location.origin}/lobby?invite=${inviteCode}`;
    const shareText = `Join my D&D game session "${sessionName}"!\nInvite Code: ${inviteCode}\nOr use this link: ${inviteUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${sessionName}`,
          text: shareText,
        });
      } catch (err) {
        // User cancelled or error - fall back to copy
        handleCopyInviteCode(inviteCode);
      }
    } else {
      // Fall back to copy
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard",
      });
    }
  };

  const handleJoinByInvite = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const sessionInfo = await getSessionByInvite(inviteCode.toUpperCase());
      setSelectedInviteSession(sessionInfo as GameSession);
      setShowInviteDialog(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid invite code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmJoinInvite = async (characterId: number) => {
    if (!selectedInviteSession?.invite_code) return;

    setLoading(true);
    try {
      const result = await joinSessionByInvite(selectedInviteSession.invite_code, characterId);
      toast({
        title: "Success!",
        description: `Joined ${result.session_name}`,
      });
      setShowInviteDialog(false);
      setInviteCode("");
      setSelectedInviteSession(null);
      loadGameData();
      navigate(`/game-session/${result.session_id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check for invite code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteParam = urlParams.get("invite");
    if (inviteParam) {
      setInviteCode(inviteParam);
      setActiveTab("invite");
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 p-4 relative overflow-hidden fantasy-bg">
        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Fantasy Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
        
        {/* Magical Particles Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent/30 rounded-full floating-particle"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/40 rounded-full floating-particle" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-accent/20 rounded-full floating-particle" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-primary/30 rounded-full floating-particle" style={{animationDelay: '3s'}}></div>
          <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-accent/25 rounded-full floating-particle" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-1/6 left-1/2 w-1 h-1 bg-primary/35 rounded-full floating-particle" style={{animationDelay: '5s'}}></div>
          <div className="absolute bottom-1/6 right-1/6 w-1.5 h-1.5 bg-accent/15 rounded-full floating-particle" style={{animationDelay: '6s'}}></div>
        </div>
        
        {/* Magical Shine Effect */}
        <div className="absolute inset-0 magical-shine"></div>
        <FantasyCard variant="parchment" withRunes className="w-full max-w-lg p-10 space-y-8 relative z-10">
          <FantasyCardHeader className="text-center space-y-6 pb-6">
            <div className="flex justify-center items-center space-x-4">
              <Sword className="h-10 w-10 text-primary animate-pulse" />
              <Shield className="h-10 w-10 text-accent" />
              <Scroll className="h-10 w-10 text-primary animate-pulse" style={{animationDelay: '0.5s'}} />
            </div>
            <div className="space-y-3">
              <FantasyCardTitle className="text-4xl md:text-5xl font-fantasy-title text-mystical leading-tight">
                DUNGEONS & DRAGONS AI
              </FantasyCardTitle>
              <FantasyCardDescription className="text-xl md:text-2xl font-fantasy-body text-accent/90 tracking-wide">
                ENTER THE REALM OF ADVENTURE
              </FantasyCardDescription>
            </div>
            <div className="pt-4 border-t border-accent/30">
              <p className="text-sm text-muted-foreground font-fantasy-body italic">
                "Where legends are born and heroes rise"
              </p>
            </div>
          </FantasyCardHeader>
          <FantasyCardContent className="space-y-6">

          <Tabs value={isRegister ? "register" : "login"} onValueChange={(v) => setIsRegister(v === "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 border-2 border-accent/30">
              <TabsTrigger value="login" className="font-fantasy-heading text-base data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
                ⚔️ LOGIN
              </TabsTrigger>
              <TabsTrigger value="register" className="font-fantasy-heading text-base data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
                📜 REGISTER
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="font-fantasy-heading text-sm uppercase tracking-wider text-accent/90">
                  ⚜ Username ⚜
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ENTER YOUR USERNAME"
                  className="bg-background/80 text-foreground font-fantasy-body h-12 text-base border-2 border-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="font-fantasy-heading text-sm uppercase tracking-wider text-accent/90">
                  ⚜ Password ⚜
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ENTER YOUR PASSWORD"
                  className="bg-background/80 text-foreground font-fantasy-body h-12 text-base border-2 border-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-destructive font-fantasy-body text-center">{error}</p>
                </div>
              )}
              <FantasyButton 
                onClick={handleAuth} 
                variant="rune" 
                size="lg"
                className="w-full h-14 text-lg font-fantasy-heading uppercase tracking-wider shadow-lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ENTERING REALM...
                  </>
                ) : (
                  <>
                    <span className="text-xl">⚜</span>
                    <LogIn className="mr-2 h-5 w-5" />
                    LOGIN
                    <span className="text-xl">⚜</span>
                  </>
                )}
              </FantasyButton>
              <div className="pt-4 border-t border-accent/20 text-center">
                <p className="text-xs text-muted-foreground font-fantasy-body">
                  New adventurer? Switch to Register tab above
                </p>
              </div>
            </TabsContent>

            <TabsContent value="register" className="space-y-5 mt-6">
              <div className="space-y-3">
                <Label htmlFor="reg-username" className="font-fantasy-heading text-sm uppercase tracking-wider text-accent/90">
                  ⚜ Username ⚜
                </Label>
                <Input
                  id="reg-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="CHOOSE A USERNAME"
                  className="bg-background/80 text-foreground font-fantasy-body h-12 text-base border-2 border-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="reg-email" className="font-fantasy-heading text-sm uppercase tracking-wider text-accent/90">
                  ⚜ Email ⚜
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL"
                  className="bg-background/80 text-foreground font-fantasy-body h-12 text-base border-2 border-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="reg-password" className="font-fantasy-heading text-sm uppercase tracking-wider text-accent/90">
                  ⚜ Password ⚜
                </Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="CREATE A PASSWORD"
                  className="bg-background/80 text-foreground font-fantasy-body h-12 text-base border-2 border-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="reg-confirm" className="font-fantasy-heading text-sm uppercase tracking-wider text-accent/90">
                  ⚜ Confirm Password ⚜
                </Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="CONFIRM YOUR PASSWORD"
                  className="bg-background/80 text-foreground font-fantasy-body h-12 text-base border-2 border-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-destructive font-fantasy-body text-center">{error}</p>
                </div>
              )}
              <FantasyButton 
                onClick={handleAuth} 
                variant="rune" 
                size="lg"
                className="w-full h-14 text-lg font-fantasy-heading uppercase tracking-wider shadow-lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  <>
                    <span className="text-xl">⚜</span>
                    <UserPlus className="mr-2 h-5 w-5" />
                    REGISTER
                    <span className="text-xl">⚜</span>
                  </>
                )}
              </FantasyButton>
              <div className="pt-4 border-t border-accent/20 text-center">
                <p className="text-xs text-muted-foreground font-fantasy-body">
                  Already have an account? Switch to Login tab above
                </p>
              </div>
            </TabsContent>
          </Tabs>
          </FantasyCardContent>
        </FantasyCard>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4 relative overflow-hidden fantasy-bg">
      {/* Fantasy Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
      
      {/* Magical Particles Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent/30 rounded-full floating-particle"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/40 rounded-full floating-particle" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-accent/20 rounded-full floating-particle" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-primary/30 rounded-full floating-particle" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-accent/25 rounded-full floating-particle" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/6 left-1/2 w-1 h-1 bg-primary/35 rounded-full floating-particle" style={{animationDelay: '5s'}}></div>
        <div className="absolute bottom-1/6 right-1/6 w-1.5 h-1.5 bg-accent/15 rounded-full floating-particle" style={{animationDelay: '6s'}}></div>
      </div>
      
      {/* Magical Shine Effect */}
      <div className="absolute inset-0 magical-shine"></div>
      
      {/* Top Navigation Bar */}
      <nav className="w-full px-4 py-3 relative z-20 backdrop-blur-sm bg-background/80 border-b border-border/30 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-fantasy-title bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent leading-tight whitespace-nowrap text-mystical">
            Dungeons & Dragons AI
          </h1>
          <div className="flex items-center gap-2">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <FantasyButton variant="ghost" size="sm" className="font-fantasy-body">
                    <User className="h-4 w-4 mr-2" />
                    <span>{user.username}</span>
                  </FantasyButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Campaigns Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Scroll className="mr-2 h-4 w-4" />
                      Campaigns
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-96 overflow-y-auto">
                      {campaigns.length === 0 ? (
                        <DropdownMenuItem disabled className="text-muted-foreground">
                          No campaigns yet
                        </DropdownMenuItem>
                      ) : (
                        campaigns.map((campaign) => (
                          <DropdownMenuItem
                            key={campaign.id}
                            onClick={() => navigate(`/create-campaign?campaignId=${campaign.id}`)}
                            className="flex items-center gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{campaign.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{campaign.theme}</p>
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/create-campaign")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Campaign
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  {/* Characters Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Users className="mr-2 h-4 w-4" />
                      Characters
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-96 overflow-y-auto">
                      {characters.length === 0 ? (
                        <DropdownMenuItem disabled className="text-muted-foreground">
                          No characters yet
                        </DropdownMenuItem>
                      ) : (
                        characters.map((character) => (
                          <DropdownMenuItem
                            key={character.id}
                            onClick={() => navigate(`/character-create?edit=${character.id}`)}
                            className="flex items-center gap-2"
                          >
                            {character.image_base64 ? (
                              <img
                                src={`data:image/png;base64,${character.image_base64}`}
                                alt={character.character_name}
                                className="w-8 h-8 rounded-full border border-border object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full border border-border bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{character.character_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {character.race} • {character.class_and_level}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/character-create")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Character
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <ThemeToggle />
            <FantasyButton
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="font-fantasy-body"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </FantasyButton>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto relative z-10 px-4">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-fantasy-title bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-mystical">
                    GAME LOBBY
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <User className="h-5 w-5 text-accent" />
                    <span className="text-muted-foreground font-fantasy-body">Welcome, <span className="text-accent font-semibold">{user?.username || "Player"}</span>!</span>
                  </div>
                </div>
                {isAuthenticated && (
                  <div className="flex items-center gap-3">
                    <FantasyButton
                      onClick={() => navigate("/create-campaign")}
                      variant="outline"
                      size="lg"
                      className="font-fantasy-heading"
                    >
                      <Scroll className="h-4 w-4 mr-2" />
                      ⚜ CAMPAIGNS ⚜
                    </FantasyButton>
                    <FantasyButton
                      onClick={() => navigate("/characters")}
                      variant="outline"
                      size="lg"
                      className="font-fantasy-heading"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      ⚜ CHARACTERS ⚜
                    </FantasyButton>
                  </div>
                )}
              </div>
            </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "join" | "create" | "invite")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="join" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              My Sessions
            </TabsTrigger>
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Join by Invite
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Start New Game
            </TabsTrigger>
          </TabsList>

          <TabsContent value="join" className="space-y-4">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sessions.length === 0 ? (
              <FantasyCard variant="parchment" withRunes className="p-12 text-center">
                <Gamepad2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-fantasy-heading font-semibold mb-2 text-glow-accent">No Active Sessions</h3>
                <p className="text-muted-foreground mb-4 font-fantasy-body">Create a new game session to get started!</p>
                <FantasyButton 
                  onClick={() => setActiveTab("create")} 
                  variant="rune"
                  size="lg"
                  className="font-fantasy-heading"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  ⚜ CREATE SESSION ⚜
                </FantasyButton>
              </FantasyCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => (
                  <FantasyCard
                    key={session.id}
                    variant="quest"
                    className="cursor-pointer"
                    onClick={() => handleJoinSession(session.id)}
                  >
                    <FantasyCardHeader>
                      <FantasyCardTitle className="font-fantasy-heading">
                        {session.session_name}
                      </FantasyCardTitle>
                      <FantasyCardDescription className="space-y-2 font-fantasy-body">
                        <div className="text-xs text-muted-foreground">Session ID: {session.id}</div>
                        {session.invite_code && (
                          <div className="flex items-center gap-2 mt-3 p-2 bg-primary/10 border border-primary/30 rounded-lg">
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-primary mb-1">Invite Code</div>
                              <span className="text-base font-mono font-bold text-foreground tracking-wider">
                                {session.invite_code}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-primary/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyInviteCode(session.invite_code!);
                                }}
                                title="Copy invite code"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-primary/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareInvite(session.invite_code!, session.session_name);
                                }}
                                title="Share invite code"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </FantasyCardDescription>
                    </FantasyCardHeader>
                    <FantasyCardContent>
                      <FantasyButton 
                        variant="rune"
                        size="lg"
                        className="w-full font-fantasy-heading" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinSession(session.id);
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        ⚜ JOIN SESSION ⚜
                      </FantasyButton>
                    </FantasyCardContent>
                  </FantasyCard>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invite" className="space-y-4">
            <FantasyCard variant="parchment" withRunes className="p-6">
              <FantasyCardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-accent/30">
                <FantasyCardTitle className="text-2xl font-fantasy-heading text-glow-primary">Join Game by Invite Code</FantasyCardTitle>
                <FantasyCardDescription className="text-base mt-1 font-fantasy-body">
                  Enter an invite code to join someone's game session
                </FantasyCardDescription>
              </FantasyCardHeader>
              <FantasyCardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold font-fantasy-heading">⚜ Invite Code ⚜</Label>
                  <div className="flex gap-2">
                    <Input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="ENTER INVITE CODE (e.g., ABC12345)"
                      className="bg-background/80 text-foreground border-2 border-accent/40 font-mono text-lg tracking-wider font-fantasy-body focus:border-accent"
                      maxLength={8}
                    />
                    <FantasyButton
                      onClick={handleJoinByInvite}
                      variant="rune"
                      size="lg"
                      disabled={loading || !inviteCode.trim()}
                      className="font-fantasy-heading"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          CHECKING...
                        </>
                      ) : (
                        <>
                          <span className="text-lg">⚜</span>
                          <Search className="mr-2 h-4 w-4" />
                          JOIN
                          <span className="text-lg">⚜</span>
                        </>
                      )}
                    </FantasyButton>
                  </div>
                </div>
              </FantasyCardContent>
            </FantasyCard>
          </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <FantasyCard variant="parchment" withRunes className="p-6">
                  <FantasyCardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-accent/30">
                    <FantasyCardTitle className="text-2xl font-fantasy-heading text-glow-primary">Create New Game Session</FantasyCardTitle>
                    <FantasyCardDescription className="text-base mt-1 font-fantasy-body">
                      Start a new adventure with a campaign and characters
                    </FantasyCardDescription>
                  </FantasyCardHeader>
                  <FantasyCardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Session Name</Label>
                  <Input
                    value={newSession.session_name}
                    onChange={(e) => setNewSession({ ...newSession, session_name: e.target.value })}
                    placeholder="Session 1: The Journey Begins"
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground font-semibold">Campaign</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateCampaign(!showCreateCampaign)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {showCreateCampaign ? "Cancel" : "New Campaign"}
                    </Button>
                  </div>
                  {showCreateCampaign ? (
                    <div className="space-y-3 p-4 border rounded-lg bg-background/50 border-border">
                      {/* Template Selector */}
                      <div className="space-y-2">
                        <Label className="text-sm">Campaign Template (Optional)</Label>
                        <Select 
                          value={newCampaignTemplate} 
                          onValueChange={(value) => {
                            setNewCampaignTemplate(value);
                            if (value) {
                              const template = campaignTemplates.find(t => t.id === value);
                              if (template) {
                                setNewCampaignOutline(template.outline);
                                setNewCampaignDifficulty(template.difficulty);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="bg-background text-foreground text-sm">
                            <SelectValue placeholder="Choose a template..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px]">
                            <SelectItem value="">Custom (Write Your Own)</SelectItem>
                            {campaignTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex items-center gap-2">
                                  <span>{template.icon}</span>
                                  <span>{template.name}</span>
                                  <span className="text-xs text-muted-foreground">({template.difficulty})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Difficulty */}
                      <div className="space-y-2">
                        <Label className="text-sm">Difficulty Level</Label>
                        <Select 
                          value={newCampaignDifficulty} 
                          onValueChange={(v: 'Easy' | 'Medium' | 'Hard' | 'Deadly') => setNewCampaignDifficulty(v)}
                        >
                          <SelectTrigger className="bg-background text-foreground text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Easy">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-500">●</span>
                                  <span className="font-semibold">Easy</span>
                                </div>
                                <div className="text-xs text-muted-foreground pl-5">
                                  3 acts • 3 quests/act • Max 2 monsters/quest
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="Medium">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-yellow-500">●</span>
                                  <span className="font-semibold">Medium</span>
                                </div>
                                <div className="text-xs text-muted-foreground pl-5">
                                  4 acts • 4 quests/act • Max 3 monsters/quest
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="Hard">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-orange-500">●</span>
                                  <span className="font-semibold">Hard</span>
                                </div>
                                <div className="text-xs text-muted-foreground pl-5">
                                  5 acts • 5 quests/act • Max 4 monsters/quest
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="Deadly">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-red-500">●</span>
                                  <span className="font-semibold">Deadly</span>
                                </div>
                                <div className="text-xs text-muted-foreground pl-5">
                                  6 acts • 6 quests/act • Max 5 monsters/quest
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Automatically sets acts, quests, and monster limits
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Campaign Outline</Label>
                        <Input
                          value={newCampaignOutline}
                          onChange={(e) => setNewCampaignOutline(e.target.value)}
                          placeholder="e.g., A dark fantasy campaign with dragons and ancient ruins"
                          className="bg-background text-foreground border-border text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          {newCampaignTemplate 
                            ? "Template outline loaded. You can edit it to customize."
                            : "Describe the type of D&D campaign you want to create"}
                        </p>
                      </div>
                      <Button
                        onClick={handleCreateCampaign}
                        disabled={creatingCampaign || !newCampaignOutline.trim()}
                        size="sm"
                        className="w-full"
                      >
                        {creatingCampaign ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Creating Campaign...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-3 w-3" />
                            Create Campaign
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={newSession.campaign_id.toString()}
                      onValueChange={(value) => setNewSession({ ...newSession, campaign_id: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-background text-foreground border-border">
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No campaigns yet. Click "New Campaign" above to create one.
                          </div>
                        ) : (
                          campaigns.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id.toString()}>
                              {campaign.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Characters</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-4 bg-background/50 border-border">
                    {characters.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No characters yet. <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/character-create")}>Create one</Button>
                      </p>
                    ) : (
                      characters.map((char) => (
                        <div key={char.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`char-${char.id}`}
                            checked={newSession.character_ids.includes(char.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewSession({
                                  ...newSession,
                                  character_ids: [...newSession.character_ids, char.id],
                                });
                              } else {
                                setNewSession({
                                  ...newSession,
                                  character_ids: newSession.character_ids.filter((id) => id !== char.id),
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`char-${char.id}`}
                            className="flex-1 cursor-pointer text-foreground"
                          >
                            {char.character_name} ({char.race} {char.class_and_level})
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <FantasyButton
                  onClick={handleCreateSession}
                  variant="rune"
                  size="lg"
                  disabled={loading || !newSession.session_name || !newSession.campaign_id || newSession.character_ids.length === 0}
                  className="w-full font-fantasy-heading uppercase tracking-wider"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      CREATING...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">⚜</span>
                      <Plus className="mr-2 h-4 w-4" />
                      CREATE SESSION
                      <span className="text-lg">⚜</span>
                    </>
                  )}
                </FantasyButton>
              </FantasyCardContent>
            </FantasyCard>
          </TabsContent>
        </Tabs>

        {/* Join by Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="bg-card border-2 border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl">Join Game Session</DialogTitle>
              <DialogDescription>
                {selectedInviteSession && (
                  <div className="mt-2 space-y-1">
                    <p className="font-semibold text-foreground">{selectedInviteSession.session_name}</p>
                    {selectedInviteSession.campaign_id && (
                      <p className="text-sm text-muted-foreground">
                        Campaign ID: {selectedInviteSession.campaign_id}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">Select a character to join with:</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {characters.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You need to create a character first.</p>
                  <Button onClick={() => navigate("/character-create")}>
                    Create Character
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {characters.map((char) => (
                    <FantasyCard
                      key={char.id}
                      variant="quest"
                      className="cursor-pointer"
                      onClick={() => handleConfirmJoinInvite(char.id)}
                    >
                      <FantasyCardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground font-fantasy-heading">{char.character_name}</p>
                            <p className="text-sm text-muted-foreground font-fantasy-body">
                              {char.race} {char.class_and_level}
                            </p>
                          </div>
                          <Play className="h-5 w-5 text-primary" />
                        </div>
                      </FantasyCardContent>
                    </FantasyCard>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GameLobby;

