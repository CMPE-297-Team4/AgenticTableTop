import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut } from "lucide-react";
import { generateCampaign, type Campaign } from "@/services/campaignApi";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [outline, setOutline] = useState("I want a dark fantasy campaign with dragons and ancient ruins.");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, loading: authLoading } = useAuth();

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
      const campaign: Campaign = await generateCampaign({ outline });
      
      // Store campaign in sessionStorage for Game page
      sessionStorage.setItem("currentCampaign", JSON.stringify(campaign));
      
      toast({
        title: "Success!",
        description: `Generated "${campaign.title}" with ${campaign.total_acts} acts and ${campaign.total_quests} quests!`,
      });
      
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
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent leading-tight text-no-clip">
            AgenticTableTop
          </h1>
          <p className="text-xl text-muted-foreground">
            AI-Powered D&D Campaign Generator
          </p>
          <p className="text-sm text-muted-foreground">
            Generate complete campaigns with story, acts, and quests in minutes!
          </p>
        </div>

        <div className="space-y-4">
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
        </div>

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
