import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Play, Trash2, ArrowLeft, Users } from "lucide-react";
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
      toast({
        title: "Error",
        description: error.message || "Failed to create session",
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/campaign")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Game Sessions</h1>
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
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first game session to start playing!
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle>{session.session_name}</CardTitle>
                  <CardDescription>
                    Act {session.current_act_index + 1}, Quest {session.current_quest_index + 1}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => handleStartSession(session.id)}
                      className="flex-1"
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
                  {session.last_played_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last played: {new Date(session.last_played_at).toLocaleDateString()}
                    </p>
                  )}
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

