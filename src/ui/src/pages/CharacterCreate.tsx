import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save, Image as ImageIcon } from "lucide-react";
import { createCharacter, type PlayerCharacterCreateRequest, type PlayerCharacter } from "@/services/campaignApi";
import { useAuth } from "@/contexts/AuthContext";

const CharacterCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [character, setCharacter] = useState<PlayerCharacter | null>(null);

  const [formData, setFormData] = useState<PlayerCharacterCreateRequest>({
    character_name: "",
    class_and_level: "",
    race: "",
    background: "",
    alignment: "",
    player_name: "",
  });

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
      const created = await createCharacter(formData);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => setCharacter(null)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Create Another Character
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{character.character_name}</CardTitle>
              <CardDescription>
                {character.race} {character.class_and_level} - {character.alignment}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {character.image_base64 && (
                  <div>
                    <Label>Portrait</Label>
                    <div className="mt-2">
                      <img
                        src={`data:image/png;base64,${character.image_base64}`}
                        alt={character.character_name}
                        className="w-full rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label>Player Name</Label>
                    <p className="text-sm text-muted-foreground">{character.player_name}</p>
                  </div>
                  <div>
                    <Label>Background</Label>
                    <p className="text-sm text-muted-foreground">{character.background}</p>
                  </div>
                  {character.character_data?.abilities && (
                    <div>
                      <Label>Abilities</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
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
                      <Label>Combat Stats</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
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
                <Button onClick={() => navigate("/campaign")}>
                  <Save className="mr-2 h-4 w-4" />
                  Go to Campaigns
                </Button>
                <Button variant="outline" onClick={() => navigate("/sessions")}>
                  Create Game Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/campaign")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create D&D Character</CardTitle>
            <CardDescription>
              Generate a full D&D 5e character with AI. Fill in the basic details and we'll create a complete character sheet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="character_name">Character Name *</Label>
                  <Input
                    id="character_name"
                    value={formData.character_name}
                    onChange={(e) => setFormData({ ...formData, character_name: e.target.value })}
                    placeholder="Aragorn"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="player_name">Player Name</Label>
                  <Input
                    id="player_name"
                    value={formData.player_name}
                    onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                    placeholder="Your name (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="class_and_level">Class & Level *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.class_and_level.split(" ")[0] || ""}
                      onValueChange={(value) => {
                        const level = formData.class_and_level.split(" ")[1] || "1";
                        setFormData({ ...formData, class_and_level: `${value} ${level}` });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls} value={cls}>
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
                      className="w-20"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="race">Race *</Label>
                  <Select
                    value={formData.race}
                    onValueChange={(value) => setFormData({ ...formData, race: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select race" />
                    </SelectTrigger>
                    <SelectContent>
                      {races.map((race) => (
                        <SelectItem key={race} value={race}>
                          {race}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="background">Background *</Label>
                  <Select
                    value={formData.background}
                    onValueChange={(value) => setFormData({ ...formData, background: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select background" />
                    </SelectTrigger>
                    <SelectContent>
                      {backgrounds.map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="alignment">Alignment *</Label>
                  <Select
                    value={formData.alignment}
                    onValueChange={(value) => setFormData({ ...formData, alignment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      {alignments.map((align) => (
                        <SelectItem key={align} value={align}>
                          {align}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Character...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Create Character
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CharacterCreate;

