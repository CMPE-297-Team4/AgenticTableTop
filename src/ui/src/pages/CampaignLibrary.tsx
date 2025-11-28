import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FantasyButton } from "@/components/FantasyButton";
import { FantasyCard, FantasyCardContent, FantasyCardDescription, FantasyCardHeader, FantasyCardTitle } from "@/components/FantasyCard";
import { AppNavBar } from "@/components/AppNavBar";
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
  ArrowLeft,
  Scroll,
  User,
  Play,
  LogOut,
  Home
} from "lucide-react";
import { 
  searchCampaigns, 
  deleteCampaign, 
  getCampaign,
  listUserCampaigns,
  loadCampaign,
  listCharacters,
  type SearchResult,
  type SearchRequest,
  type PlayerCharacter
} from "@/services/campaignApi";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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

const CampaignLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{
    id: number;
    title: string;
    theme: string;
    background: string;
    created_at: string | null;
    updated_at: string | null;
  }>>([]);
  const [characters, setCharacters] = useState<PlayerCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadCampaigns();
      loadCharacters();
    }
  }, [authLoading, isAuthenticated]);

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const data = await listUserCampaigns();
      setCampaigns(data);
    } catch (error: any) {
      console.error("Error loading campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }

    setSearching(true);
    setShowSearchResults(true);
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

  const handleDeleteCampaign = async (campaignId: number) => {
    setDeletingId(campaignId);
    try {
      await deleteCampaign(campaignId.toString());
      setCampaigns(campaigns => campaigns.filter(c => c.id !== campaignId));
      setSearchResults(results => results.filter(r => parseInt(r.id) !== campaignId));
      
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
      setDeletingId(null);
    }
  };

  const handleViewCampaign = async (campaignId: number) => {
    setLoading(true);
    try {
      const campaign = await loadCampaign(campaignId);
      
      // Store campaign in sessionStorage for Game page
      sessionStorage.setItem("currentCampaign", JSON.stringify(campaign));
      
      toast({
        title: "Success",
        description: `Loaded "${campaign.title}"`,
      });
      
      // Navigate to campaign creation page with this campaign selected
      navigate(`/create-campaign?campaignId=${campaignId}`);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 relative overflow-hidden fantasy-bg">
      {/* Fantasy Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
      
      {/* Magical Particles Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent/30 rounded-full floating-particle"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/40 rounded-full floating-particle" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-accent/20 rounded-full floating-particle" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Magical Shine Effect */}
      <div className="absolute inset-0 magical-shine"></div>
      
      {/* Top Navigation Bar */}
      <AppNavBar
        campaigns={campaigns}
        characters={characters}
        onNavigateToCampaign={(campaignId) => navigate(`/create-campaign?campaignId=${campaignId}`)}
        onNavigateToCharacter={(characterId) => navigate(`/character-create?edit=${characterId}`)}
        className="mb-6"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-fantasy-title bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 text-mystical">
              MY CAMPAIGNS
            </h1>
            <p className="text-muted-foreground font-fantasy-body text-lg">
              Manage your campaigns and create new adventures
            </p>
          </div>
          <FantasyButton
            onClick={() => navigate("/create-campaign")}
            variant="rune"
            size="lg"
            className="font-fantasy-heading"
          >
            <Plus className="h-4 w-4 mr-2" />
            ⚜ CREATE CAMPAIGN ⚜
          </FantasyButton>
        </div>

        {/* Search Section */}
        <FantasyCard variant="parchment" className="mb-6">
          <FantasyCardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search campaigns by theme, story, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-background/80 text-foreground font-fantasy-body border-2 border-accent/40 focus:border-accent"
                />
              </div>
              <FantasyButton
                onClick={handleSearch}
                disabled={searching}
                variant="rune"
                className="font-fantasy-heading"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </FantasyButton>
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-fantasy-body">
              Use natural language to find campaigns. Try: "dark fantasy", "dragons", "mystery", "comedy"
            </p>
          </FantasyCardContent>
        </FantasyCard>

        {/* Campaigns List */}
        {loadingCampaigns ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : showSearchResults && searchResults.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-fantasy-heading text-glow-accent mb-4">
              Search Results ({searchResults.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((campaign) => (
                <FantasyCard key={campaign.id} variant="quest" className="character-card-hover">
                  <FantasyCardHeader>
                    <FantasyCardTitle className="text-xl font-fantasy-heading">{campaign.title}</FantasyCardTitle>
                    <FantasyCardDescription className="font-fantasy-body">
                      Theme: {campaign.theme}
                    </FantasyCardDescription>
                  </FantasyCardHeader>
                  <FantasyCardContent className="space-y-4">
                    {campaign.tags && campaign.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {campaign.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs font-fantasy-body">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground font-fantasy-body">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(campaign.created_at)}
                    </div>
                    {campaign.score && (
                      <div className="text-xs text-muted-foreground font-fantasy-body">
                        Similarity: {(campaign.score * 100).toFixed(1)}%
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-accent/20">
                      <FantasyButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCampaign(parseInt(campaign.id))}
                        disabled={loading}
                        className="flex-1 font-fantasy-body"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </FantasyButton>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <FantasyButton
                            variant="destructive"
                            size="sm"
                            disabled={deletingId === parseInt(campaign.id)}
                            className="font-fantasy-body"
                          >
                            {deletingId === parseInt(campaign.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </FantasyButton>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{campaign.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCampaign(parseInt(campaign.id))}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </FantasyCardContent>
                </FantasyCard>
              ))}
            </div>
          </div>
        ) : !showSearchResults && campaigns.length === 0 ? (
          <FantasyCard variant="parchment" withRunes className="p-12 text-center">
            <Scroll className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-fantasy-heading font-semibold mb-2 text-glow-accent">No Campaigns Yet</h3>
            <p className="text-muted-foreground mb-6 font-fantasy-body">
              Create your first D&D campaign to get started!
            </p>
            <FantasyButton
              onClick={() => navigate("/create-campaign")}
              variant="rune"
              size="lg"
              className="font-fantasy-heading"
            >
              <Plus className="h-4 w-4 mr-2" />
              ⚜ CREATE YOUR FIRST CAMPAIGN ⚜
            </FantasyButton>
          </FantasyCard>
        ) : !showSearchResults ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <FantasyCard key={campaign.id} variant="quest" className="character-card-hover">
                <FantasyCardHeader>
                  <FantasyCardTitle className="text-xl font-fantasy-heading">{campaign.title}</FantasyCardTitle>
                  <FantasyCardDescription className="font-fantasy-body">
                    {campaign.theme}
                  </FantasyCardDescription>
                </FantasyCardHeader>
                <FantasyCardContent className="space-y-4">
                  {campaign.background && (
                    <p className="text-sm text-muted-foreground font-fantasy-body line-clamp-3">
                      {campaign.background}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground font-fantasy-body">
                    <Calendar className="h-3 w-3 mr-1" />
                    {campaign.created_at ? formatDate(campaign.created_at) : "Unknown date"}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-accent/20">
                    <FantasyButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCampaign(campaign.id)}
                      disabled={loading}
                      className="flex-1 font-fantasy-body"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </FantasyButton>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <FantasyButton
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === campaign.id}
                          className="font-fantasy-body"
                        >
                          {deletingId === campaign.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </FantasyButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{campaign.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </FantasyCardContent>
              </FantasyCard>
            ))}
          </div>
        ) : (
          <FantasyCard variant="parchment" withRunes className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-fantasy-heading font-semibold mb-2 text-glow-accent">No Search Results</h3>
            <p className="text-muted-foreground mb-6 font-fantasy-body">
              No campaigns found matching your search. Try different keywords or create a new campaign.
            </p>
            <FantasyButton
              onClick={() => {
                setSearchQuery("");
                setShowSearchResults(false);
              }}
              variant="outline"
              className="font-fantasy-body"
            >
              Clear Search
            </FantasyButton>
          </FantasyCard>
        )}
      </div>
    </div>
  );
};

export default CampaignLibrary;
