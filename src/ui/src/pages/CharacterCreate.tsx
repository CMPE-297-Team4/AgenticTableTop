import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FantasyButton } from "@/components/FantasyButton";
import { FantasyCard, FantasyCardContent, FantasyCardDescription, FantasyCardHeader, FantasyCardTitle } from "@/components/FantasyCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save, Image as ImageIcon, User, Home } from "lucide-react";
import { createCharacter, type PlayerCharacterCreateRequest, type PlayerCharacter } from "@/services/campaignApi";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const CharacterCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId");
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [character, setCharacter] = useState<PlayerCharacter | null>(null);

  const [formData, setFormData] = useState<PlayerCharacterCreateRequest>({
    character_name: "",
    class_and_level: "",
    race: "",
    background: "",
    alignment: "",
    player_name: user?.username || "", // Auto-set from logged-in user
    campaign_id: campaignId ? parseInt(campaignId) : undefined,
  });

  // Update campaign_id when URL param changes
  useEffect(() => {
    if (campaignId) {
      setFormData(prev => ({ ...prev, campaign_id: parseInt(campaignId) }));
    }
  }, [campaignId]);

  // Update player_name when user changes
  useEffect(() => {
    if (user?.username) {
      setFormData(prev => ({ ...prev, player_name: user.username }));
    }
  }, [user]);

  const races = ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Gnome", "Half-Elf", "Half-Orc", "Tiefling"];
  const classes = ["Fighter", "Wizard", "Rogue", "Cleric", "Ranger", "Paladin", "Barbarian", "Bard", "Sorcerer", "Warlock", "Monk", "Druid"];
  const backgrounds = ["Acolyte", "Criminal", "Folk Hero", "Noble", "Sage", "Soldier", "Hermit", "Entertainer", "Guild Artisan", "Outlander", "Sailor", "Urchin"];
  const alignments = ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please log in to create a character",
        variant: "destructive",
      });
      return;
    }

    if (!formData.character_name || !formData.class_and_level || !formData.race || !formData.background || !formData.alignment) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Always use the logged-in user's username as player_name
      const requestData = {
        ...formData,
        player_name: user?.username || "Player",
      };
      const created = await createCharacter(requestData);
      setCharacter(created);
      toast({
        title: "Success!",
        description: `Character "${created.character_name}" created successfully!`,
      });
    } catch (error: any) {
      console.error("Error creating character:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create character. Make sure the backend is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (character) {
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
        <nav className="w-full px-4 py-3 relative z-20 backdrop-blur-sm bg-background/80 border-b border-border/30 mb-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-fantasy-title bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent leading-tight whitespace-nowrap text-mystical">
              Dungeons & Dragons AI
            </h1>
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2 font-fantasy-body">
                  <User className="h-4 w-4" />
                  <span>{user.username}</span>
                </div>
              )}
              <ThemeToggle />
              <FantasyButton variant="ghost" size="sm" onClick={() => navigate("/")} className="font-fantasy-body">
                <Home className="h-4 w-4 mr-2" />
                Home
              </FantasyButton>
            </div>
          </div>
        </nav>
        
        <div className="max-w-4xl mx-auto relative z-10 p-4">
          <FantasyButton variant="ghost" onClick={() => setCharacter(null)} className="mb-4 font-fantasy-body">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Create Another Character
          </FantasyButton>

          <FantasyCard variant="parchment" withRunes>
            <FantasyCardHeader>
              <FantasyCardTitle className="text-2xl font-fantasy-heading">{character.character_name}</FantasyCardTitle>
              <FantasyCardDescription className="font-fantasy-body">
                {character.race} {character.class_and_level} - {character.alignment}
              </FantasyCardDescription>
            </FantasyCardHeader>
            <FantasyCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {character.image_base64 && (
                  <div>
                    <Label className="font-fantasy-heading">Portrait</Label>
                    <div className="mt-2">
                      <img
                        src={`data:image/png;base64,${character.image_base64}`}
                        alt={character.character_name}
                        className="w-full rounded-lg border-2 border-accent/30"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label className="font-fantasy-heading">Player Name</Label>
                    <p className="text-sm text-muted-foreground font-fantasy-body">{character.player_name}</p>
                  </div>
                  <div>
                    <Label className="font-fantasy-heading">Background</Label>
                    <p className="text-sm text-muted-foreground font-fantasy-body">{character.background}</p>
                  </div>
                  {character.character_data?.abilities && (
                    <div>
                      <Label className="font-fantasy-heading">Abilities</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm font-fantasy-body">
                        <div>STR: {character.character_data.abilities.strength}</div>
                        <div>DEX: {character.character_data.abilities.dexterity}</div>
                        <div>CON: {character.character_data.abilities.constitution}</div>
                        <div>INT: {character.character_data.abilities.intelligence}</div>
                        <div>WIS: {character.character_data.abilities.wisdom}</div>
                        <div>CHA: {character.character_data.abilities.charisma}</div>
                      </div>
                    </div>
                  )}
                  {character.character_data?.combat_stats && (
                    <div>
                      <Label className="font-fantasy-heading">Combat Stats</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm font-fantasy-body">
                        <div>AC: {character.character_data.combat_stats.armor_class}</div>
                        <div>HP: {character.character_data.combat_stats.current_hit_points}/{character.character_data.combat_stats.hit_point_maximum}</div>
                        <div>Speed: {character.character_data.combat_stats.speed} ft</div>
                        <div>Level: {character.class_and_level.split(" ")[1] || "1"}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <FantasyButton variant="outline" onClick={() => setCharacter(null)} className="font-fantasy-body">
                  Create Another Character
                </FantasyButton>
                <FantasyButton variant="rune" onClick={() => {
                  if (campaignId) {
                    // Store campaign ID for session creation
                    sessionStorage.setItem("newCampaignId", campaignId);
                  }
                  navigate("/lobby");
                }} className="font-fantasy-heading">
                  <Save className="mr-2 h-4 w-4" />
                  ⚜ Go to Game Lobby ⚜
                </FantasyButton>
              </div>
            </FantasyCardContent>
          </FantasyCard>
        </div>
      </div>
    );
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
      <nav className="w-full px-4 py-3 relative z-20 backdrop-blur-sm bg-background/80 border-b border-border/30 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-fantasy-title bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent leading-tight whitespace-nowrap text-mystical">
            Dungeons & Dragons AI
          </h1>
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2 font-fantasy-body">
                <User className="h-4 w-4" />
                <span>{user.username}</span>
              </div>
            )}
            <ThemeToggle />
            <FantasyButton variant="ghost" size="sm" onClick={() => navigate("/")} className="font-fantasy-body">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </FantasyButton>
          </div>
        </div>
      </nav>
      
      <div className="max-w-2xl mx-auto relative z-10 p-4">
        <FantasyCard variant="parchment" withRunes>
          <FantasyCardHeader>
            <FantasyCardTitle className="font-fantasy-heading text-2xl">Create D&D Character</FantasyCardTitle>
            <FantasyCardDescription className="font-fantasy-body">
              Generate a full D&D 5e character with AI. Fill in the basic details and we'll create a complete character sheet.
            </FantasyCardDescription>
          </FantasyCardHeader>
          <FantasyCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="character_name" className="font-fantasy-heading">⚜ Character Name * ⚜</Label>
                  <Input
                    id="character_name"
                    value={formData.character_name}
                    onChange={(e) => setFormData({ ...formData, character_name: e.target.value })}
                    placeholder="Aragorn"
                    required
                    className="bg-background/80 text-foreground font-fantasy-body border-2 border-accent/40 focus:border-accent"
                  />
                </div>

                <div>
                  <Label htmlFor="player_name" className="font-fantasy-heading">Player Name</Label>
                  <div className="flex items-center gap-2 p-2 rounded-md border-2 border-accent/40 bg-muted/50 text-foreground font-fantasy-body">
                    <span className="text-sm">{user?.username || "Not logged in"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-fantasy-body">
                    Character will be created for your account
                  </p>
                </div>

                <div>
                  <Label htmlFor="class_and_level" className="font-fantasy-heading">⚜ Class & Level * ⚜</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.class_and_level.split(" ")[0] || ""}
                      onValueChange={(value) => {
                        const level = formData.class_and_level.split(" ")[1] || "1";
                        setFormData({ ...formData, class_and_level: `${value} ${level}` });
                      }}
                    >
                      <SelectTrigger className="font-fantasy-body">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent className="font-fantasy-body">
                        {classes.map((cls) => (
                          <SelectItem key={cls} value={cls} className="font-fantasy-body">
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.class_and_level.split(" ")[1] || "1"}
                      onChange={(e) => {
                        const cls = formData.class_and_level.split(" ")[0] || classes[0];
                        setFormData({ ...formData, class_and_level: `${cls} ${e.target.value}` });
                      }}
                      className="w-20 font-fantasy-body"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="race" className="font-fantasy-heading">⚜ Race * ⚜</Label>
                  <Select
                    value={formData.race}
                    onValueChange={(value) => setFormData({ ...formData, race: value })}
                  >
                    <SelectTrigger className="font-fantasy-body">
                      <SelectValue placeholder="Select race" />
                    </SelectTrigger>
                    <SelectContent className="font-fantasy-body">
                      {races.map((race) => (
                        <SelectItem key={race} value={race} className="font-fantasy-body">
                          {race}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="background" className="font-fantasy-heading">⚜ Background * ⚜</Label>
                  <Select
                    value={formData.background}
                    onValueChange={(value) => setFormData({ ...formData, background: value })}
                  >
                    <SelectTrigger className="font-fantasy-body">
                      <SelectValue placeholder="Select background" />
                    </SelectTrigger>
                    <SelectContent className="font-fantasy-body">
                      {backgrounds.map((bg) => (
                        <SelectItem key={bg} value={bg} className="font-fantasy-body">
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="alignment" className="font-fantasy-heading">⚜ Alignment * ⚜</Label>
                  <Select
                    value={formData.alignment}
                    onValueChange={(value) => setFormData({ ...formData, alignment: value })}
                  >
                    <SelectTrigger className="font-fantasy-body">
                      <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent className="font-fantasy-body">
                      {alignments.map((align) => (
                        <SelectItem key={align} value={align} className="font-fantasy-body">
                          {align}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <FantasyButton type="submit" variant="rune" size="lg" disabled={loading} className="w-full font-fantasy-heading">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    GENERATING CHARACTER...
                  </>
                ) : (
                  <>
                    <span className="text-lg">⚜</span>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    CREATE CHARACTER
                    <span className="text-lg">⚜</span>
                  </>
                )}
              </FantasyButton>
            </form>
          </FantasyCardContent>
        </FantasyCard>
      </div>
    </div>
  );
};

export default CharacterCreate;

