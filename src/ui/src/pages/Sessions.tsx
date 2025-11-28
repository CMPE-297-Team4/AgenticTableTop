import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Play, Trash2, ArrowLeft, Users, Gamepad2, Home } from "lucide-react";
import {
  listSessions,
  deleteSession,
  listCharacters,
  createSession,
  listUserCampaigns,
  type GameSession,
  type PlayerCharacter,
  type Campaign,
} from "@/services/campaignApi";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const Sessions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<PlayerCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newSession, setNewSession] = useState({
    session_name: "",
    campaign_id: 0,
    character_ids: [] as number[],
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      
      // Check if there's a new campaign ID from character creation
      const newCampaignId = sessionStorage.getItem("newCampaignId");
      if (newCampaignId) {
        // Auto-open create dialog and pre-select the campaign
        setCreateDialogOpen(true);
        setNewSession(prev => ({ ...prev, campaign_id: parseInt(newCampaignId) }));
        sessionStorage.removeItem("newCampaignId");
      }
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
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
        description: "Failed to load sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

    setCreating(true);
    try {
      await createSession(newSession);
      toast({
        title: "Success!",
        description: "Session created successfully",
      });
      setCreateDialogOpen(false);
      setNewSession({ session_name: "", campaign_id: 0, character_ids: [] });
      loadData();
    } catch (error: any) {
      console.error("Error creating session:", error);
      // Handle error message properly
      let errorMessage = "Failed to create session";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
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
      setCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this session?")) {
      return;
    }

    try {
      await deleteSession(sessionId);
      toast({
        title: "Success",
        description: "Session deleted",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  const handleStartSession = (sessionId: number) => {
    navigate(`/game-session/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="hover:bg-accent/20">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Game Sessions
              </h1>
              <p className="text-muted-foreground mt-1">Manage your D&D gameplay sessions</p>
            </div>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Game Session</DialogTitle>
                <DialogDescription>
                  Start a new gameplay session with a campaign and characters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Session Name</Label>
                  <Input
                    value={newSession.session_name}
                    onChange={(e) => setNewSession({ ...newSession, session_name: e.target.value })}
                    placeholder="Session 1: The Journey Begins"
                  />
                </div>
                <div>
                  <Label>Campaign</Label>
                  <Select
                    value={newSession.campaign_id.toString()}
                    onValueChange={(value) => setNewSession({ ...newSession, campaign_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Characters</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {characters.map((char) => (
                      <div key={char.id} className="flex items-center space-x-2">
                        <Checkbox
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
                        <Label className="font-normal">
                          {char.character_name} ({char.race} {char.class_and_level})
                        </Label>
                      </div>
                    ))}
                  </div>
                  {characters.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      No characters found. <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/character-create")}>Create one first</Button>
                    </p>
                  )}
                </div>
                <Button onClick={handleCreateSession} disabled={creating} className="w-full">
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Session"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {sessions.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-border/50 bg-card/50">
            <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Sessions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a new session to start your adventure!
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-to-r from-primary to-primary/80">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Session
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card 
                key={session.id}
                className="hover:border-primary hover:shadow-lg transition-all bg-gradient-to-br from-card to-card/50 border-2"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-foreground">{session.session_name}</span>
                    <Gamepad2 className="h-5 w-5 text-primary" />
                  </CardTitle>
                  <CardDescription>
                    Act {session.current_act_index + 1}, Quest {session.current_quest_index + 1}
                  </CardDescription>
                  {session.last_played_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last played: {new Date(session.last_played_at).toLocaleDateString()}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartSession(session.id)}
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Continue
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;

