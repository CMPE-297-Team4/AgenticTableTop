import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FantasyButton } from "@/components/FantasyButton";
import { FantasyCard, FantasyCardContent, FantasyCardHeader, FantasyCardTitle, FantasyCardDescription } from "@/components/FantasyCard";
import { Card } from "@/components/ui/card";
import { AppNavBar } from "@/components/AppNavBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Library, User, Play, Scroll, Users, Gamepad2, Settings, ChevronDown, ChevronUp, Plus, Home } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { generateCampaign, loadCampaign, listUserCampaigns, listCharacters, type Campaign, type CampaignRequest, type PlayerCharacter } from "@/services/campaignApi";
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
import { useAuth } from "@/contexts/AuthContext";
import { campaignTemplates, type CampaignTemplate } from "@/data/campaignTemplates";

const Index = () => {
  const [outline, setOutline] = useState("I want a dark fantasy campaign with dragons and ancient ruins.");
  const [loading, setLoading] = useState(false);
  const [saveToPinecone, setSaveToPinecone] = useState(false);
  const [userId, setUserId] = useState("");
  const [tags, setTags] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<'Easy' | 'Medium' | 'Hard' | 'Deadly'>('Medium');
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [useTemplate, setUseTemplate] = useState(false);
  const [numActs, setNumActs] = useState<number | ''>('');
  const [numQuestsPerAct, setNumQuestsPerAct] = useState<number | ''>('');
  const [generateMonsters, setGenerateMonsters] = useState(true);
  const [monstersPerQuest, setMonstersPerQuest] = useState<number | ''>('');
  const [savedCampaigns, setSavedCampaigns] = useState<Array<{
    id: number;
    title: string;
    theme: string;
    background: string;
    created_at: string | null;
    updated_at: string | null;
  }>>([]);
  const [characters, setCharacters] = useState<PlayerCharacter[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { logout, loading: authLoading, user } = useAuth();

  // Load saved campaigns and characters on mount
  useEffect(() => {
    if (!authLoading && user) {
      loadSavedCampaigns();
      loadCharacters();
    }
  }, [authLoading, user]);

  const loadSavedCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const campaigns = await listUserCampaigns();
      console.log("Loaded campaigns:", campaigns);
      setSavedCampaigns(campaigns || []);
    } catch (error: any) {
      console.error("Error loading campaigns:", error);
      setSavedCampaigns([]);
      // Don't show error toast, just log it
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const loadCharacters = async () => {
    try {
      const chars = await listCharacters();
      setCharacters(chars);
    } catch (error: any) {
      console.error("Error loading characters:", error);
      // Don't show error toast, just log it
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4 font-fantasy-body">Please log in to create campaigns</p>
          <FantasyButton onClick={() => navigate("/")} variant="outline">Go to Login</FantasyButton>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!outline.trim()) {
      toast({
        title: "Error",
        description: "Please enter a campaign outline",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const request: CampaignRequest = {
        outline,
        save_to_pinecone: saveToPinecone,
        user_id: userId || undefined,
        tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        force_new: true,  // Always generate a new campaign, bypass cache
        difficulty_level: difficultyLevel,
        num_acts: numActs ? Number(numActs) : undefined,
        num_quests_per_act: numQuestsPerAct ? Number(numQuestsPerAct) : undefined,
        generate_monsters: generateMonsters,
        monsters_per_quest: monstersPerQuest ? Number(monstersPerQuest) : undefined,
      };
      
      const campaign: Campaign = await generateCampaign(request);
      
      // Store campaign in sessionStorage for Game page
      sessionStorage.setItem("currentCampaign", JSON.stringify(campaign));
      
      toast({
        title: "Success!",
        description: `Generated "${campaign.title}" with ${campaign.total_acts} acts and ${campaign.total_quests} quests! Now create characters to start playing.`,
      });
      
      // Reload saved campaigns
      await loadSavedCampaigns();
      
      // Store campaign ID for quick session creation
      sessionStorage.setItem("newCampaignId", String(campaign.id));
      
      // Navigate to lobby to create characters and start game
      navigate("/lobby");
    } catch (error: any) {
      console.error("Error generating campaign:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate campaign. Make sure the backend is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCampaign = async (campaignId: number) => {
    setLoading(true);
    try {
      const campaign = await loadCampaign(campaignId);
      
      // Store campaign in sessionStorage for Game page
      sessionStorage.setItem("currentCampaign", JSON.stringify(campaign));
      
      toast({
        title: "Campaign Loaded!",
        description: `Loaded "${campaign.title}"`,
      });
      
      // Navigate to game page
      navigate("/game");
    } catch (error: any) {
      console.error("Error loading campaign:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load campaign.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Debug: Log to verify component is rendering
  console.log("Index component rendering, user:", user, "authLoading:", authLoading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 relative overflow-hidden fantasy-bg">
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
      
      {/* Top Navigation Bar */}
      <AppNavBar
        campaigns={savedCampaigns}
        characters={characters}
        onNavigateToCampaign={(campaignId) => navigate(`/create-campaign?campaignId=${campaignId}`)}
        onNavigateToCharacter={(characterId) => navigate(`/character-create?edit=${characterId}`)}
      />

      {/* Magical Shine Effect */}
      <div className="absolute inset-0 magical-shine pointer-events-none"></div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
        <div className="flex justify-center items-start pt-8">
          <div className="w-full max-w-2xl">
            <FantasyCard variant="parchment" withRunes className="w-full p-8 space-y-6">
          <FantasyCardHeader className="text-center pb-4">
            <FantasyCardTitle className="font-fantasy-title text-mystical text-2xl mb-2">
              Create Campaign
            </FantasyCardTitle>
          </FantasyCardHeader>
          <FantasyCardContent>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate New</TabsTrigger>
            <TabsTrigger value="load">Load Campaign</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4 mt-4">
          {/* Campaign Templates */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Template</Label>
            <Select 
              value={selectedTemplate || "custom"} 
              onValueChange={(value) => {
                if (value === "custom") {
                  setSelectedTemplate("");
                  setUseTemplate(false);
                } else {
                  setSelectedTemplate(value);
                  const template = campaignTemplates.find(t => t.id === value);
                  if (template) {
                    setOutline(template.outline);
                    setDifficultyLevel(template.difficulty);
                    setUseTemplate(true);
                  }
                }
              }}
            >
              <SelectTrigger className="bg-background text-foreground">
                <SelectValue placeholder="Choose a template or write your own..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="custom">Custom Campaign (Write Your Own)</SelectItem>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b">Fantasy Themes</div>
                {campaignTemplates.filter(t => ['Dark Fantasy', 'High Fantasy', 'Fairy Tale', 'Dragon Riders'].includes(t.theme)).map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{template.icon}</span>
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">({template.difficulty})</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mt-2">Mystery & Horror</div>
                {campaignTemplates.filter(t => ['Murder Mystery', 'Gothic Horror', 'Zombie'].includes(t.theme)).map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{template.icon}</span>
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">({template.difficulty})</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mt-2">Historical & Ancient</div>
                {campaignTemplates.filter(t => ['Ancient', 'Viking', 'Samurai', 'Pirate', 'Wild West'].includes(t.theme)).map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{template.icon}</span>
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">({template.difficulty})</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mt-2">Modern & Sci-Fi</div>
                {campaignTemplates.filter(t => ['Steampunk', 'Cyberpunk', 'Urban Fantasy', 'Space Opera'].includes(t.theme)).map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{template.icon}</span>
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">({template.difficulty})</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mt-2">Special Themes</div>
                {campaignTemplates.filter(t => ['Comedy', 'Political', 'Underwater', 'Time Travel', 'Post-Apocalyptic'].includes(t.theme)).map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{template.icon}</span>
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">({template.difficulty})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && selectedTemplate !== "custom" && (
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground break-words flex items-center gap-2">
                  <span className="text-lg">{campaignTemplates.find(t => t.id === selectedTemplate)?.icon}</span>
                  <span className="font-semibold text-foreground">{campaignTemplates.find(t => t.id === selectedTemplate)?.name}</span>
                  <span className="ml-2">
                    • <span className="font-semibold text-foreground">{difficultyLevel}</span>
                    {difficultyLevel !== campaignTemplates.find(t => t.id === selectedTemplate)?.difficulty && (
                      <span className="text-muted-foreground ml-1">(was {campaignTemplates.find(t => t.id === selectedTemplate)?.difficulty})</span>
                    )}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Difficulty</Label>
            <Select value={difficultyLevel} onValueChange={(v: 'Easy' | 'Medium' | 'Hard' | 'Deadly') => setDifficultyLevel(v)}>
              <SelectTrigger className="bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-lg">●</span>
                    <span className="font-semibold">Easy</span>
                    <span className="text-xs text-muted-foreground ml-2">(3 acts, 3 quests/act)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Medium">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 text-lg">●</span>
                    <span className="font-semibold">Medium</span>
                    <span className="text-xs text-muted-foreground ml-2">(4 acts, 4 quests/act)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Hard">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-lg">●</span>
                    <span className="font-semibold">Hard</span>
                    <span className="text-xs text-muted-foreground ml-2">(5 acts, 5 quests/act)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Deadly">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 text-lg">●</span>
                    <span className="font-semibold">Deadly</span>
                    <span className="text-xs text-muted-foreground ml-2">(6 acts, 6 quests/act)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Campaign Description</Label>
            <Textarea
              value={outline}
              onChange={(e) => {
                setOutline(e.target.value);
                if (useTemplate && selectedTemplate && e.target.value !== campaignTemplates.find(t => t.id === selectedTemplate)?.outline) {
                  setSelectedTemplate("");
                  setUseTemplate(false);
                }
              }}
              placeholder="Describe your campaign idea..."
              className="min-h-24 text-foreground bg-background"
              disabled={loading}
            />
          </div>

          {/* Advanced Settings */}
          <div className="space-y-3 pt-3 border-t border-border/30">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-3 w-3" />
              Advanced Options
              {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            
            {showAdvanced && (
              <div className="space-y-3 p-3 rounded-lg border border-border/30 bg-background/30">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="num-acts" className="text-xs">Acts</Label>
                    <Input
                      id="num-acts"
                      type="number"
                      min="1"
                      max="10"
                      value={numActs}
                      onChange={(e) => setNumActs(e.target.value ? Number(e.target.value) : '')}
                      placeholder={difficultyLevel === 'Easy' ? '3' : difficultyLevel === 'Medium' ? '4' : difficultyLevel === 'Hard' ? '5' : '6'}
                      className="bg-background text-foreground h-9 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="num-quests" className="text-xs">Quests/Act</Label>
                    <Input
                      id="num-quests"
                      type="number"
                      min="1"
                      max="10"
                      value={numQuestsPerAct}
                      onChange={(e) => setNumQuestsPerAct(e.target.value ? Number(e.target.value) : '')}
                      placeholder={difficultyLevel === 'Easy' ? '3' : difficultyLevel === 'Medium' ? '4' : difficultyLevel === 'Hard' ? '5' : '6'}
                      className="bg-background text-foreground h-9 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="monsters-per-quest" className="text-xs">Monsters/Quest</Label>
                    <Input
                      id="monsters-per-quest"
                      type="number"
                      min="1"
                      max="10"
                      value={monstersPerQuest}
                      onChange={(e) => setMonstersPerQuest(e.target.value ? Number(e.target.value) : '')}
                      placeholder={difficultyLevel === 'Easy' ? '2' : difficultyLevel === 'Medium' ? '3' : difficultyLevel === 'Hard' ? '4' : '5'}
                      className="bg-background text-foreground h-9 text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="generate-monsters"
                    checked={generateMonsters}
                    onCheckedChange={(checked) => setGenerateMonsters(checked === true)}
                  />
                  <Label htmlFor="generate-monsters" className="text-xs font-normal cursor-pointer">
                    Generate monsters
                  </Label>
                </div>
              </div>
            )}
          </div>

          {/* Save Option */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="save-to-pinecone"
              checked={saveToPinecone}
              onCheckedChange={(checked) => setSaveToPinecone(checked as boolean)}
            />
            <Label
              htmlFor="save-to-pinecone"
              className="text-xs font-normal cursor-pointer"
            >
              Save to library
            </Label>
          </div>

              <FantasyButton 
                onClick={handleGenerate} 
                variant="rune"
                size="lg"
                className="w-full h-12 text-base font-fantasy-heading whitespace-normal px-4"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                    <span className="text-sm">Generating... (1-2 min)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="text-xl">⚜</span>
                    <span>Generate Campaign</span>
                    <span className="text-xl">⚜</span>
                  </span>
                )}
              </FantasyButton>
          </TabsContent>
          
          <TabsContent value="load" className="space-y-4 mt-4">
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
                ) : savedCampaigns.length === 0 ? (
                  <FantasyCard variant="parchment" className="p-8 text-center">
                    <Scroll className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground font-fantasy-body">No saved campaigns yet.</p>
                    <p className="text-sm text-muted-foreground mt-2 font-fantasy-body">Generate a new campaign to get started!</p>
                  </FantasyCard>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {savedCampaigns.map((campaign) => (
                      <FantasyCard key={campaign.id} variant="quest" className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-fantasy-heading font-semibold text-foreground break-words">{campaign.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 font-fantasy-body">{campaign.theme}</p>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 font-fantasy-body">
                              {campaign.background}
                            </p>
                            {campaign.created_at && (
                              <p className="text-xs text-muted-foreground mt-2 font-fantasy-body">
                                Created: {new Date(campaign.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </FantasyCard>
                    ))}
                  </div>
                )}
          </TabsContent>
            </Tabs>

          </FantasyCardContent>
        </FantasyCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
