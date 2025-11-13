import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  Calendar,
  Tag,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { 
  searchCampaigns, 
  deleteCampaign, 
  getCampaign,
  type SearchResult,
  type SearchRequest 
} from "@/services/campaignApi";

const CampaignLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      const request: SearchRequest = {
        query: searchQuery,
        limit: 20
      };
      
      const response = await searchCampaigns(request);
      setSearchResults(response.results);
      
      toast({
        title: "Search Complete",
        description: `Found ${response.total} campaigns`,
      });
    } catch (error: any) {
      console.error("Error searching campaigns:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to search campaigns",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteCampaign(campaignId);
      setSearchResults(results => results.filter(r => r.id !== campaignId));
      
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCampaign = async (campaignId: string) => {
    setLoading(true);
    try {
      const campaign = await getCampaign(campaignId);
      
      // Store campaign in sessionStorage for Game page
      sessionStorage.setItem("currentCampaign", JSON.stringify(campaign));
      
      toast({
        title: "Success",
        description: `Loaded "${campaign.title}"`,
      });
      
      // Navigate to game page
      navigate("/game");
    } catch (error: any) {
      console.error("Error loading campaign:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Unknown date";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4 relative overflow-hidden fantasy-bg">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Generator
            </Button>
            <h1 className="text-4xl font-bold text-foreground">
              Campaign Library
            </h1>
          </div>
          <Button
            onClick={() => navigate("/")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Search Section */}
        <Card className="p-6 mb-8 bg-background/80 backdrop-blur-sm border-border/50">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search campaigns by theme, story, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-foreground"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Use natural language to find campaigns. Try: "dark fantasy", "dragons", "mystery", "comedy"
          </p>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Search Results ({searchResults.length})
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="p-6 bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Theme: {campaign.theme}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {campaign.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(campaign.created_at)}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCampaign(campaign.id)}
                        disabled={loading}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCampaign(campaign.id, campaign.title)}
                        disabled={loading}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Similarity: {(campaign.score * 100).toFixed(1)}%
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !searching && (
          <Card className="p-12 text-center bg-background/80 backdrop-blur-sm border-border/50">
            <div className="space-y-4">
              <Search className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground">
                Search Your Campaign Library
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Use the search bar above to find campaigns by theme, story elements, or any other criteria. 
                The AI will find campaigns that are semantically similar to your search.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CampaignLibrary;
