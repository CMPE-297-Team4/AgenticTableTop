import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FantasyButton } from "@/components/FantasyButton";
import { FantasyCard, FantasyCardContent, FantasyCardDescription, FantasyCardHeader, FantasyCardTitle } from "@/components/FantasyCard";
import { AppNavBar } from "@/components/AppNavBar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ArrowLeft, User, Shield, Heart, Zap, Brain, Eye, Hand, Scroll, LogOut, Home } from "lucide-react";
import { listCharacters, deleteCharacter, listUserCampaigns, type PlayerCharacter } from "@/services/campaignApi";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { StatDisplay } from "@/components/StatDisplay";
import { HealthBar } from "@/components/HealthBar";
import { ThemeToggle } from "@/components/ThemeToggle";
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

const Characters = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user, loading: authLoading, logout } = useAuth();
  const [characters, setCharacters] = useState<PlayerCharacter[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{
    id: number;
    title: string;
    theme: string;
    background: string;
    created_at: string | null;
    updated_at: string | null;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadCharacters();
      loadCampaigns();
    }
  }, [authLoading, isAuthenticated]);

  const loadCampaigns = async () => {
    try {
      const data = await listUserCampaigns();
      setCampaigns(data);
    } catch (error: any) {
      console.error("Error loading campaigns:", error);
      // Don't show error toast, just log it
    }
  };

  const loadCharacters = async () => {
    setLoading(true);
    try {
      const chars = await listCharacters();
      setCharacters(chars);
    } catch (error: any) {
      console.error("Error loading characters:", error);
      toast({
        title: "Error",
        description: "Failed to load characters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (characterId: number) => {
    setDeletingId(characterId);
    try {
      await deleteCharacter(characterId);
      toast({
        title: "Success",
        description: "Character deleted successfully",
      });
      await loadCharacters();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete character",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
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
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-primary/30 rounded-full floating-particle" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-accent/25 rounded-full floating-particle" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/6 left-1/2 w-1 h-1 bg-primary/35 rounded-full floating-particle" style={{animationDelay: '5s'}}></div>
        <div className="absolute bottom-1/6 right-1/6 w-1.5 h-1.5 bg-accent/15 rounded-full floating-particle" style={{animationDelay: '6s'}}></div>
      </div>
      
      {/* Top Navigation Bar */}
      <AppNavBar
        campaigns={campaigns}
        characters={characters}
        onNavigateToCampaign={(campaignId) => navigate(`/create-campaign?campaignId=${campaignId}`)}
        onNavigateToCharacter={(characterId) => navigate(`/character-create?edit=${characterId}`)}
      />

      {/* Magical Shine Effect */}
      <div className="absolute inset-0 magical-shine"></div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-fantasy-title bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 text-mystical">
              MY CHARACTERS
            </h1>
            <p className="text-muted-foreground font-fantasy-body text-lg">
              Manage your D&D characters and create new ones
            </p>
          </div>
          <FantasyButton
            onClick={() => navigate("/character-create")}
            variant="rune"
            size="lg"
            className="font-fantasy-heading"
          >
            <Plus className="h-4 w-4 mr-2" />
            ⚜ CREATE CHARACTER ⚜
          </FantasyButton>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : characters.length === 0 ? (
          <FantasyCard variant="parchment" withRunes className="p-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-fantasy-heading font-semibold mb-2 text-glow-accent">No Characters Yet</h3>
            <p className="text-muted-foreground mb-6 font-fantasy-body">
              Create your first D&D character to get started!
            </p>
            <FantasyButton
              onClick={() => navigate("/character-create")}
              variant="rune"
              size="lg"
              className="font-fantasy-heading"
            >
              <Plus className="h-4 w-4 mr-2" />
              ⚜ CREATE YOUR FIRST CHARACTER ⚜
            </FantasyButton>
          </FantasyCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <FantasyCard
                key={character.id}
                variant="quest"
                className="character-card-hover"
              >
                <FantasyCardHeader>
                  <div className="flex items-start gap-4">
                    {character.image_base64 ? (
                      <img
                        src={`data:image/png;base64,${character.image_base64}`}
                        alt={character.character_name}
                        className="w-20 h-20 rounded-lg border-2 border-primary/30 object-cover flex-shrink-0"
                      />
                    ) : character.image_url ? (
                      <img
                        src={character.image_url}
                        alt={character.character_name}
                        className="w-20 h-20 rounded-lg border-2 border-primary/30 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border-2 border-primary/30 bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <FantasyCardTitle className="text-xl mb-1 font-fantasy-heading">{character.character_name}</FantasyCardTitle>
                      <FantasyCardDescription className="font-fantasy-body">
                        {character.race} • {character.class_and_level}
                      </FantasyCardDescription>
                      <div className="mt-2 text-xs text-muted-foreground font-fantasy-body">
                        <div>Background: {character.background}</div>
                        <div>Alignment: {character.alignment}</div>
                      </div>
                    </div>
                  </div>
                </FantasyCardHeader>
                <FantasyCardContent className="space-y-4">
                  {/* Health Bar */}
                  <div>
                    <HealthBar
                      current={character.hit_points || 0}
                      max={character.hit_points || 1}
                      label="Hit Points"
                      variant="default"
                    />
                  </div>

                  {/* Ability Scores */}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Ability Scores
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <StatDisplay
                        label="STR"
                        value={character.strength || 10}
                        highlight={false}
                      />
                      <StatDisplay
                        label="DEX"
                        value={character.dexterity || 10}
                        highlight={false}
                      />
                      <StatDisplay
                        label="CON"
                        value={character.constitution || 10}
                        highlight={false}
                      />
                      <StatDisplay
                        label="INT"
                        value={character.intelligence || 10}
                        highlight={false}
                      />
                      <StatDisplay
                        label="WIS"
                        value={character.wisdom || 10}
                        highlight={false}
                      />
                      <StatDisplay
                        label="CHA"
                        value={character.charisma || 10}
                        highlight={false}
                      />
                    </div>
                  </div>

                  {/* Combat Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">AC:</span>
                      <span className="font-semibold">{character.armor_class || 10}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground">Speed:</span>
                      <span className="font-semibold">{character.speed || 30} ft</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-accent/20">
                    <FantasyButton
                      variant="outline"
                      size="sm"
                      className="flex-1 font-fantasy-body"
                      onClick={() => navigate(`/character-create?edit=${character.id}`)}
                    >
                      Edit
                    </FantasyButton>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <FantasyButton
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === character.id}
                          className="font-fantasy-body"
                        >
                          {deletingId === character.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </FantasyButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Character?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {character.character_name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => character.id && handleDelete(character.id)}
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
        )}
      </div>
    </div>
  );
};

export default Characters;

