import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Library, User, Play, Scroll } from "lucide-react";
import { generateCampaign, loadCampaign, listUserCampaigns, type Campaign, type CampaignRequest } from "@/services/campaignApi";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [outline, setOutline] = useState("I want a dark fantasy campaign with dragons and ancient ruins.");
  const [loading, setLoading] = useState(false);
  const [saveToPinecone, setSaveToPinecone] = useState(false);
  const [userId, setUserId] = useState("");
  const [tags, setTags] = useState("");
  const [savedCampaigns, setSavedCampaigns] = useState<Array<{
    id: number;
    title: string;
    theme: string;
    background: string;
    created_at: string | null;
    updated_at: string | null;
  }>>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, loading: authLoading, user } = useAuth();

  // Load saved campaigns on mount
  useEffect(() => {
    if (!authLoading && user) {
      loadSavedCampaigns();
    }
  }, [authLoading, user]);

  const loadSavedCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const campaigns = await listUserCampaigns();
      setSavedCampaigns(campaigns);
    } catch (error: any) {
      console.error("Error loading campaigns:", error);
      // Don't show error toast, just log it
    } finally {
      setLoadingCampaigns(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
        force_new: true  // Always generate a new campaign, bypass cache
      };
      
      const campaign: Campaign = await generateCampaign(request);
      
      // Store campaign in sessionStorage for Game page
      sessionStorage.setItem("currentCampaign", JSON.stringify(campaign));
      
      toast({
        title: "Success!",
        description: `Generated "${campaign.title}" with ${campaign.total_acts} acts and ${campaign.total_quests} quests! Campaign saved to your library.`,
      });
      
      // Reload saved campaigns
      await loadSavedCampaigns();
      
      // Navigate to game page
      navigate("/game");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 p-4 relative overflow-hidden fantasy-bg">
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
      
      <Card className="w-full max-w-2xl p-8 space-y-6 invisible-boundary magical-glow relative z-10 backdrop-blur-sm bg-card/95 border-0 outline-0 shadow-none ring-0">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent leading-tight text-no-clip">
            AgenticTableTop
          </h1>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.username}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/library")}
              className="text-foreground hover:text-primary"
            >
              <Library className="h-4 w-4 mr-2" />
              Library
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-foreground hover:text-primary"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-xl text-muted-foreground">
            AI-Powered D&D Campaign Generator
          </p>
          <p className="text-sm text-muted-foreground">
            Generate complete campaigns with story, acts, and quests in minutes!
          </p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate New</TabsTrigger>
            <TabsTrigger value="load">Load Campaign</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Campaign Outline</label>
            <Textarea
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              placeholder="Describe the type of D&D campaign you want..."
              className="min-h-32 text-foreground bg-background"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Example: "I want a high fantasy campaign with political intrigue, dragon riders, and ancient magical artifacts"
            </p>
          </div>

          {/* Pinecone Storage Options */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-to-pinecone"
                checked={saveToPinecone}
                onCheckedChange={(checked) => setSaveToPinecone(checked as boolean)}
              />
              <label
                htmlFor="save-to-pinecone"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Save to Campaign Library (Pinecone)
              </label>
            </div>
            
            {saveToPinecone && (
              <div className="space-y-3 pl-6">
                <div>
                  <label className="text-sm text-muted-foreground">
                    User ID (optional)
                  </label>
                  <Input
                    placeholder="Enter user ID for organization"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="text-foreground"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">
                    Tags (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g., dark-fantasy, dragons, mystery"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="text-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleGenerate} 
            className="w-full h-12 text-lg magical-glow hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Campaign... (this may take 1-2 minutes)
              </>
            ) : (
              "Generate Campaign"
            )}
          </Button>
          </TabsContent>
          
          <TabsContent value="load" className="space-y-4 mt-4">
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : savedCampaigns.length === 0 ? (
              <Card className="p-8 text-center">
                <Scroll className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No saved campaigns yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Generate a new campaign to get started!</p>
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {savedCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="p-4 hover:bg-accent/10 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{campaign.theme}</p>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {campaign.background}
                        </p>
                        {campaign.created_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {new Date(campaign.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleLoadCampaign(campaign.id)}
                        disabled={loading}
                        size="sm"
                        className="ml-4"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Load
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="border-t pt-6 space-y-2">
          <h3 className="font-semibold text-sm">What You'll Get:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✨ Rich campaign background story with themes</li>
            <li>📖 3-5 acts with narrative structure</li>
            <li>🎯 Detailed quests for each act</li>
            <li>🎲 Ready to play immediately!</li>
          </ul>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>Make sure the backend API is running on <code>localhost:8000</code></p>
        </div>
      </Card>
    </div>
  );
};

export default Index;
