import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  Save,
  Volume2,
  VolumeX,
  Sword,
  Shield,
  Wand2,
  Package,
  MessageSquare,
  Search,
  Play,
  Pause,
} from "lucide-react";
import {
  startSession,
  saveSession,
  playerAction,
  narrateScene,
  getSceneNarrationAudio,
  type PlayerActionRequest,
  type Campaign,
  type PlayerCharacter,
} from "@/services/campaignApi";
import { useAuth } from "@/contexts/AuthContext";

const GameSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sessionState, setSessionState] = useState<any>(null);
  const [narration, setNarration] = useState<string>("");
  const [narrativeHistory, setNarrativeHistory] = useState<any[]>([]);
  const [actionDescription, setActionDescription] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [actionType, setActionType] = useState("INVESTIGATE");
  const [processingAction, setProcessingAction] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const actionTypes = [
    { value: "MOVE", label: "Move", icon: Play },
    { value: "ATTACK", label: "Attack", icon: Sword },
    { value: "CAST_SPELL", label: "Cast Spell", icon: Wand2 },
    { value: "USE_ITEM", label: "Use Item", icon: Package },
    { value: "TALK", label: "Talk", icon: MessageSquare },
    { value: "INVESTIGATE", label: "Investigate", icon: Search },
  ];

  useEffect(() => {
    if (sessionId && isAuthenticated) {
      loadSession();
    }
  }, [sessionId, isAuthenticated]);

  const loadSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const data = await startSession(parseInt(sessionId));
      setCampaign(data.campaign);
      setSessionState(data.state);
      setNarrativeHistory(data.state?.narrative_history || []);
      
      // Set first character as default
      if (data.state?.player_characters?.length > 0) {
        setSelectedCharacter(data.state.player_characters[0].character_name);
      }

      // Get initial scene narration
      await loadSceneNarration();
    } catch (error: any) {
      console.error("Error loading session:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load session",
        variant: "destructive",
      });
      navigate("/sessions");
    } finally {
      setLoading(false);
    }
  };

  const loadSceneNarration = async () => {
    if (!sessionId) return;

    try {
      const scene = await narrateScene(parseInt(sessionId));
      setNarration(scene.narration);
      
      // Add to narrative history
      setNarrativeHistory((prev) => [
        ...prev,
        { type: "dm_narration", content: scene.narration, timestamp: new Date().toISOString() },
      ]);
    } catch (error: any) {
      console.error("Error loading scene:", error);
    }
  };

  const handleAction = async () => {
    if (!sessionId || !selectedCharacter || !actionDescription.trim()) {
      toast({
        title: "Error",
        description: "Please select a character and describe your action",
        variant: "destructive",
      });
      return;
    }

    setProcessingAction(true);
    try {
      const action: PlayerActionRequest = {
        action_type: actionType,
        character_name: selectedCharacter,
        description: actionDescription,
      };

      const response = await playerAction(parseInt(sessionId), action);
      
      // Update state
      setSessionState(response.state_update);
      setNarrativeHistory(response.state_update?.narrative_history || []);
      
      // Add DM response to narration
      setNarration(response.dm_narration);
      
      // Clear action description
      setActionDescription("");

      toast({
        title: "Action processed",
        description: response.result === "success" ? "Your action was successful!" : "Action completed",
      });
    } catch (error: any) {
      console.error("Error processing action:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process action",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSave = async () => {
    if (!sessionId) return;

    try {
      await saveSession(parseInt(sessionId));
      toast({
        title: "Success",
        description: "Session saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save session",
        variant: "destructive",
      });
    }
  };

  const handlePlayAudio = async () => {
    if (!sessionId) return;

    try {
      if (audioUrl) {
        // Stop current audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setAudioUrl(null);
        setIsPlayingAudio(false);
        return;
      }

      const audioBlob = await getSceneNarrationAudio(parseInt(sessionId));
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(url);
        setAudioUrl(null);
      };
      
      audio.play();
      setIsPlayingAudio(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate audio",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!campaign || !sessionState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <p>Session not found</p>
      </div>
    );
  }

  const playerCharacters = sessionState.player_characters || [];
  const activeQuest = sessionState.active_quest;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="flex h-screen">
        {/* Sidebar - Character Sheets */}
        <div className="w-80 border-r bg-background/50 overflow-y-auto">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Characters</h2>
              <Button variant="ghost" size="icon" onClick={() => navigate("/sessions")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-4 space-y-4">
              {playerCharacters.map((char: any) => {
                const charData = char.data || {};
                const combatStats = charData.combat_stats || {};
                return (
                  <Card key={char.id} className={selectedCharacter === char.character_name ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{char.character_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {charData.race} {charData.class_and_level}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">HP: </span>
                          {combatStats.current_hit_points}/{combatStats.hit_point_maximum}
                        </div>
                        <div>
                          <span className="text-muted-foreground">AC: </span>
                          {combatStats.armor_class}
                        </div>
                      </div>
                      {charData.abilities && (
                        <div className="text-xs space-y-1">
                          <div className="grid grid-cols-3 gap-1">
                            <div>STR: {charData.abilities.strength}</div>
                            <div>DEX: {charData.abilities.dexterity}</div>
                            <div>CON: {charData.abilities.constitution}</div>
                            <div>INT: {charData.abilities.intelligence}</div>
                            <div>WIS: {charData.abilities.wisdom}</div>
                            <div>CHA: {charData.abilities.charisma}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b bg-background/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{campaign.title}</h1>
                {activeQuest && (
                  <p className="text-sm text-muted-foreground">
                    Quest: {activeQuest.quest_name}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" onClick={loadSceneNarration}>
                  Refresh Scene
                </Button>
              </div>
            </div>
          </div>

          {/* Scene Narration */}
          <div className="flex-1 overflow-y-auto p-6">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Scene</CardTitle>
                  <Button variant="ghost" size="icon" onClick={handlePlayAudio}>
                    {isPlayingAudio ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <p className="whitespace-pre-wrap">{narration || "Loading scene..."}</p>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Narrative History */}
            {narrativeHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {narrativeHistory.slice(-10).map((event, idx) => (
                        <div key={idx} className="text-sm border-l-2 pl-2 border-muted">
                          <span className="text-muted-foreground text-xs">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          <p className="mt-1">{event.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Panel */}
          <div className="border-t bg-background/50 p-4">
            <Card>
              <CardHeader>
                <CardTitle>Take Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Character</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedCharacter}
                      onChange={(e) => setSelectedCharacter(e.target.value)}
                    >
                      <option value="">Select character</option>
                      {playerCharacters.map((char: any) => (
                        <option key={char.id} value={char.character_name}>
                          {char.character_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Action Type</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                    >
                      {actionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Action Description</Label>
                  <Textarea
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    placeholder="Describe what you want to do..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleAction}
                  disabled={processingAction || !selectedCharacter || !actionDescription.trim()}
                  className="w-full"
                >
                  {processingAction ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Take Action"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSession;

