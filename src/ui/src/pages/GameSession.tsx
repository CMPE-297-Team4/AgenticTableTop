import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FantasyButton } from "@/components/FantasyButton";
import { FantasyCard, FantasyCardContent, FantasyCardDescription, FantasyCardHeader, FantasyCardTitle } from "@/components/FantasyCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Gamepad2,
  Scroll,
  Users,
  Crown,
  BookOpen,
  MapPin,
  Target,
  CheckCircle,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Home,
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
  getAuthHeaders,
} from "@/services/campaignApi";
import { useAuth } from "@/contexts/AuthContext";
import { NPCImageGenerator } from "@/components/NPCImageGenerator";
import { HealthBar } from "@/components/HealthBar";
import { StatDisplay } from "@/components/StatDisplay";
import { QuestProgress } from "@/components/QuestProgress";
import { DiceRoller } from "@/components/DiceRoller";
import { AchievementBadge } from "@/components/AchievementBadge";

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
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);
  const narrationWordsRef = useRef<string[]>([]);
  const wordTimingsRef = useRef<number[]>([]);
  const [currentTurn, setCurrentTurn] = useState<string>("DM");
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default 320px (w-80)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [narrationHeight, setNarrationHeight] = useState(50); // Percentage of available height
  const [isResizingNarration, setIsResizingNarration] = useState(false);
  const narrationRef = useRef<HTMLDivElement | null>(null);
  const narrationResizeRef = useRef<HTMLDivElement | null>(null);
  const [showSceneNarration, setShowSceneNarration] = useState(true); // Show initially, hide after first action
  const [hasPlayerActed, setHasPlayerActed] = useState(false); // Track if player has taken an action
  const [messageAudios, setMessageAudios] = useState<Map<string, string>>(new Map()); // Store audio URLs by message timestamp
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null); // Track which message is playing by timestamp
  const [pausedMessageId, setPausedMessageId] = useState<string | null>(null); // Track which message is paused by timestamp
  const messageAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map()); // Audio elements by message timestamp
  const chatScrollRef = useRef<HTMLDivElement>(null); // Reference to chat container for auto-scrolling

  const actionTypes = [
    { value: "MOVE", label: "Move", icon: Play },
    { value: "ATTACK", label: "Attack", icon: Sword },
    { value: "CAST_SPELL", label: "Cast Spell", icon: Wand2 },
    { value: "USE_ITEM", label: "Use Item", icon: Package },
    { value: "TALK", label: "Talk", icon: MessageSquare },
    { value: "INVESTIGATE", label: "Investigate", icon: Search },
  ];

  useEffect(() => {
    if (!sessionId) {
      console.error("No sessionId provided");
      navigate("/sessions");
      return;
    }
    if (!isAuthenticated) {
      console.log("Not authenticated, waiting...");
      return;
    }
    loadSession();
  }, [sessionId, isAuthenticated]);

  const loadSession = async () => {
    if (!sessionId) {
      console.error("No sessionId in loadSession");
      setLoading(false);
      navigate("/sessions");
      return;
    }

    setLoading(true);
    try {
      console.log("Loading session:", sessionId);
      const data = await startSession(parseInt(sessionId));
      console.log("Session data received:", data);
      
      if (!data || !data.campaign || !data.state) {
        throw new Error("Invalid session data received");
      }
      
      setCampaign(data.campaign);
      setSessionState(data.state);
      setNarrativeHistory(data.state?.narrative_history || []);
      
      // Set turn order and current turn
      setTurnOrder(data.state?.turn_order || ["DM"]);
      setCurrentTurn(data.state?.current_turn || "DM");
      
      // Set first character as default
      if (data.state?.player_characters?.length > 0) {
        setSelectedCharacter(data.state.player_characters[0].character_name);
      }

      // Check for cached narration in session state first (fastest)
      const cachedNarration = data.state?.cached_scene_narration;
      if (cachedNarration && cachedNarration.narration) {
        console.log("Using cached narration from session state");
        setNarration(cachedNarration.narration);
        prepareNarrationForHighlighting(cachedNarration.narration);
        
        // Auto-play audio if available (don't await, let it play in background)
        if (cachedNarration.audio_data) {
          playAudioFromBase64(cachedNarration.audio_data).catch(err => {
            console.error("Error playing audio:", err);
          });
        }
        
        // Add to narrative history if not already there
        const hasNarration = data.state?.narrative_history?.some(
          (event: any) => event.type === "dm_narration" && event.content === cachedNarration.narration
        );
        if (!hasNarration) {
          setNarrativeHistory((prev) => [
            ...prev,
            { type: "dm_narration", content: cachedNarration.narration, timestamp: new Date().toISOString() },
          ]);
        }
        
        setLoading(false);
      } else if (data.initial_narration && data.initial_narration.narration) {
        // Use initial narration from start_session if available
        setNarration(data.initial_narration.narration);
        prepareNarrationForHighlighting(data.initial_narration.narration);
        
        // Auto-play audio if available (don't await, let it play in background)
        if (data.initial_narration.audio_data) {
          playAudioFromBase64(data.initial_narration.audio_data).catch(err => {
            console.error("Error playing audio:", err);
          });
        }
        
        // Add to narrative history
        setNarrativeHistory((prev) => [
          ...prev,
          { 
            type: "dm_narration", 
            content: data.initial_narration.narration, 
            timestamp: new Date().toISOString() 
          },
        ]);
        setLoading(false);
      } else if (data.state?.narrative_history && data.state.narrative_history.length > 0) {
        // If no initial narration but we have narrative history, use the last DM narration
        const lastDmNarration = [...data.state.narrative_history]
          .reverse()
          .find((event: any) => event.type === "dm_narration");
        if (lastDmNarration) {
          const narrationText = lastDmNarration.content || lastDmNarration.message || "";
          setNarration(narrationText);
          prepareNarrationForHighlighting(narrationText);
          setLoading(false);
        } else {
          // Get initial scene narration
          try {
            await loadSceneNarration();
          } catch (sceneError: any) {
            console.error("Error loading scene narration:", sceneError);
            // Set fallback narration
            const fallbackNarration = "The scene unfolds before you. The air is thick with anticipation as you prepare for what lies ahead.";
            setNarration(fallbackNarration);
            prepareNarrationForHighlighting(fallbackNarration);
          } finally {
            setLoading(false);
          }
        }
      } else {
        // Get initial scene narration
        try {
          await loadSceneNarration();
        } catch (sceneError: any) {
          console.error("Error loading scene narration:", sceneError);
          // Set fallback narration
          const fallbackNarration = "The scene unfolds before you. The air is thick with anticipation as you prepare for what lies ahead.";
          setNarration(fallbackNarration);
          prepareNarrationForHighlighting(fallbackNarration);
        } finally {
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error("Error loading session:", error);
      
      // Enhanced error message with actionable guidance
      let errorMessage = error.message || "Failed to load session";
      let errorTitle = "Error Loading Session";
      
      // Detect network/backend connection errors
      if (errorMessage.includes("Cannot connect to backend") || 
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError")) {
        errorTitle = "Backend Server Not Running";
        errorMessage = (
          "The backend server is not running. Please:\n\n" +
          "1. Open a terminal\n" +
          "2. Make sure you have API keys in .env file\n" +
          "3. Run: make start-backend\n" +
          "4. Refresh this page\n\n" +
          "See QUICK_START_BACKEND.md for detailed instructions."
        );
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds so user can read it
      });
      setLoading(false);
      // Don't navigate away on network errors - let user fix and retry
      if (!errorMessage.includes("Backend Server Not Running")) {
        navigate("/sessions");
      }
    }
  };

  const prepareNarrationForHighlighting = (text: string) => {
    // Split narration into words while preserving spaces and punctuation
    const words = text.split(/(\s+|[.,!?;:])/).filter(word => word.trim().length > 0 || /^\s+$/.test(word));
    narrationWordsRef.current = words;
    wordTimingsRef.current = [];
    setHighlightedWordIndex(-1);
  };

  const loadSceneNarration = async () => {
    if (!sessionId) {
      throw new Error("No sessionId provided");
    }

    try {
      console.log("Loading scene narration for session:", sessionId);
      const scene = await narrateScene(parseInt(sessionId));
      console.log("Scene narration received:", scene);
      
      // Check if narration exists
      if (scene && scene.narration) {
        setNarration(scene.narration);
        prepareNarrationForHighlighting(scene.narration);
        
        // Auto-play audio if available (don't await, let it play in background)
        if (scene.audio_data) {
          playAudioFromBase64(scene.audio_data).catch(err => {
            console.error("Error playing audio:", err);
          });
        }
        
        // Add to narrative history
        setNarrativeHistory((prev) => [
          ...prev,
          { type: "dm_narration", content: scene.narration, timestamp: new Date().toISOString() },
        ]);
      } else {
        // Fallback narration if none provided
        const fallbackNarration = "The scene unfolds before you. The air is thick with anticipation as you prepare for what lies ahead.";
        setNarration(fallbackNarration);
        prepareNarrationForHighlighting(fallbackNarration);
        console.warn("No narration returned from server, using fallback");
      }
    } catch (error: any) {
      console.error("Error loading scene:", error);
      // Set fallback narration on error
      const fallbackNarration = "The scene unfolds before you. The air is thick with anticipation as you prepare for what lies ahead.";
      setNarration(fallbackNarration);
      prepareNarrationForHighlighting(fallbackNarration);
      toast({
        title: "Warning",
        description: "Scene narration could not be loaded, but the game continues.",
        variant: "default",
      });
      throw error; // Re-throw to let loadSession handle it
    }
  };

  const playAudioFromBase64 = async (base64Audio: string) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current && isPlayingAudio) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Reset highlighting
      setHighlightedWordIndex(-1);
      
      // Convert base64 to blob
      const audioBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const blob = new Blob([audioBytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Store URL so pause button can work
      setAudioUrl(url);
      
      // Create and play audio
      const audio = new Audio(url);
      audioRef.current = audio;
      
      // Calculate word timings based on audio duration
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        const words = narrationWordsRef.current;
        if (words.length > 0) {
          // Estimate time per word (assuming average speaking rate)
          const avgWordsPerMinute = 150; // Average speaking rate
          const timePerWord = 60 / avgWordsPerMinute;
          const totalEstimatedTime = words.length * timePerWord;
          const scaleFactor = duration / totalEstimatedTime;
          
          wordTimingsRef.current = words.map((_, index) => index * timePerWord * scaleFactor);
        }
      };
      
      // Update highlighting as audio plays
      const updateHighlighting = () => {
        if (!audioRef.current || !isPlayingAudio) return;
        
        const currentTime = audioRef.current.currentTime;
        const timings = wordTimingsRef.current;
        
        // Find the current word index based on playback time
        let wordIndex = -1;
        for (let i = 0; i < timings.length; i++) {
          if (currentTime >= timings[i]) {
            wordIndex = i;
          } else {
            break;
          }
        }
        
        if (wordIndex >= 0 && wordIndex !== highlightedWordIndex) {
          setHighlightedWordIndex(wordIndex);
        }
        
        if (isPlayingAudio) {
          requestAnimationFrame(updateHighlighting);
        }
      };
      
      audio.onplay = () => {
        setIsPlayingAudio(true);
        updateHighlighting();
      };
      
      audio.onpause = () => {
        setIsPlayingAudio(false);
      };
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        setHighlightedWordIndex(-1);
        URL.revokeObjectURL(url);
        setAudioUrl(null);
      };
      
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setHighlightedWordIndex(-1);
        URL.revokeObjectURL(url);
        setAudioUrl(null);
        console.error("Error playing audio");
      };
      
      await audio.play();
      setIsPlayingAudio(true);
    } catch (error: any) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);
      setHighlightedWordIndex(-1);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    }
  };

  const handleBeginPlayerTurn = async () => {
    if (!sessionId) return;
    
    setProcessingAction(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      
      // Call API to advance turn from DM to first player
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/advance-turn`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to advance turn: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update state with new turn information
      if (data.state) {
        setSessionState(data.state);
        setCurrentTurn(data.state.current_turn);
        setTurnOrder(data.state.turn_order || []);
        
        toast({
          title: "Player Turn Begins!",
          description: `It's now ${data.state.current_turn}'s turn`,
        });
      }
    } catch (error: any) {
      console.error("Error advancing turn:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to begin player turn",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
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

    /**
     * Message Sequence:
     * 1. Player action appears immediately (optimistic update)
     * 2. 300ms delay for readability
     * 3. "DM is typing..." indicator appears
     * 4. Backend processes and returns DM response
     * 5. Full narrative history updated with authoritative data
     */
    
    // Step 1: Add player action to UI immediately (optimistic update)
    const optimisticAction = {
      type: 'player_action',
      content: `${actionType.replace('_', ' ')}: ${actionDescription}`,
      timestamp: new Date().toISOString(),
      metadata: {
        action: {
          action_type: actionType,
          character_name: selectedCharacter,
          description: actionDescription,
        }
      }
    };
    
    setNarrativeHistory(prev => [...prev, optimisticAction]);
    
    // Step 2: Small delay to ensure player action is visible before "DM is typing..."
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 3: Show "DM is typing..." indicator
    setProcessingAction(true);

    try {
      const action: PlayerActionRequest = {
        action_type: actionType,
        character_name: selectedCharacter,
        description: actionDescription,
      };

      const response = await playerAction(parseInt(sessionId), action);
      
      // Update state
      if (response.state_update) {
        setSessionState(response.state_update);
        setNarrativeHistory(response.state_update?.narrative_history || []);
        
        // Update turn order and current turn - ensure we use the updated values
        const updatedTurnOrder = response.state_update?.turn_order;
        const updatedCurrentTurn = response.state_update?.current_turn;
        
        if (updatedTurnOrder) {
          setTurnOrder(updatedTurnOrder);
        }
        if (updatedCurrentTurn !== undefined) {
          setCurrentTurn(updatedCurrentTurn);
        }
      }
      
      // Add DM response to narration
      setNarration(response.dm_narration);
      prepareNarrationForHighlighting(response.dm_narration);
      
      // Store audio for this DM message if available
      console.log("===== AUDIO DEBUG =====");
      console.log("Response has audio_data:", !!response.audio_data);
      console.log("Response has narrative_history:", !!response.state_update?.narrative_history);
      
      if (response.audio_data && response.state_update?.narrative_history) {
        const narrativeHistory = response.state_update.narrative_history;
        console.log("Narrative history length:", narrativeHistory.length);
        
        const lastMessage = narrativeHistory[narrativeHistory.length - 1];
        console.log("Last message:", lastMessage);
        
        const messageTimestamp = lastMessage?.timestamp;
        console.log("Message timestamp:", messageTimestamp);
        
        if (messageTimestamp) {
          console.log("✅ Storing audio for message timestamp:", messageTimestamp);
          console.log("Audio data length:", response.audio_data.length);
          
          const audioBlob = base64ToBlob(response.audio_data, "audio/mpeg");
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log("Created audio URL:", audioUrl);
          
          setMessageAudios(prev => {
            const newMap = new Map(prev);
            newMap.set(messageTimestamp, audioUrl);
            console.log("✅ Updated messageAudios map. Keys:", Array.from(newMap.keys()));
            console.log("Total audio entries:", newMap.size);
            return newMap;
          });
          
          // Auto-play the DM response
          await playMessageAudio(messageTimestamp, audioUrl);
        } else {
          console.error("❌ No timestamp found on last message");
        }
      } else {
        console.error("❌ No audio data in response:", { 
          hasAudioData: !!response.audio_data, 
          hasHistory: !!response.state_update?.narrative_history,
          audioDataType: typeof response.audio_data,
          historyType: typeof response.state_update?.narrative_history
        });
      }
      console.log("===== END AUDIO DEBUG =====")
      
      // Clear action description
      setActionDescription("");

      toast({
        title: "Action processed",
        description: response.result === "success" ? "Your action was successful!" : "Action completed",
      });
    } catch (error: any) {
      console.error("Error processing action:", error);
      
      // Remove optimistic action if backend failed
      setNarrativeHistory(prev => prev.filter(e => e !== optimisticAction));
      
      toast({
        title: "Error",
        description: error.message || "Failed to process action",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const playMessageAudio = async (messageId: string, audioUrl: string) => {
    // Stop any currently playing message
    if (playingMessageId !== null && playingMessageId !== messageId && messageAudioRefs.current.has(playingMessageId)) {
      const currentAudio = messageAudioRefs.current.get(playingMessageId);
      currentAudio?.pause();
      messageAudioRefs.current.delete(playingMessageId);
    }

    // Play this message's audio
    const audio = new Audio(audioUrl);
    messageAudioRefs.current.set(messageId, audio);
    
    audio.onended = () => {
      setPlayingMessageId(null);
      messageAudioRefs.current.delete(messageId);
    };
    
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      setPlayingMessageId(null);
      messageAudioRefs.current.delete(messageId);
      toast({
        title: "Audio Error",
        description: "Failed to play narration audio",
        variant: "destructive",
      });
    };
    
    try {
      await audio.play();
      setPlayingMessageId(messageId);
      console.log(`Now playing audio for message ${messageId}`);
    } catch (error) {
      console.error("Failed to play audio:", error);
      setPlayingMessageId(null);
      messageAudioRefs.current.delete(messageId);
    }
  };

  const pauseMessageAudio = (messageId: string) => {
    const audio = messageAudioRefs.current.get(messageId);
    if (audio && !audio.paused) {
      audio.pause();
      console.log(`Paused audio for message ${messageId}`);
      // Keep the audio element and playingMessageId so we can resume
      return true;
    }
    return false;
  };

  const resumeMessageAudio = async (messageId: string) => {
    const audio = messageAudioRefs.current.get(messageId);
    if (audio && audio.paused) {
      try {
        await audio.play();
        setPlayingMessageId(messageId);
        console.log(`Resumed audio for message ${messageId}`);
        return true;
      } catch (error) {
        console.error("Failed to resume audio:", error);
        return false;
      }
    }
    return false;
  };

  const generateAudioForMessage = async (messageId: string, text: string, theme: string): Promise<string | null> => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      
      console.log("🎵 Generating audio on-demand...");
      const response = await fetch(`${API_BASE_URL}/api/dm/generate-audio`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, theme }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.audio_data) {
        const audioBlob = base64ToBlob(data.audio_data, "audio/mpeg");
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Store it for future use
        setMessageAudios(prev => {
          const newMap = new Map(prev);
          newMap.set(messageId, audioUrl);
          return newMap;
        });
        
        console.log("✅ Audio generated and stored!");
        return audioUrl;
      }
      
      return null;
    } catch (error) {
      console.error("Failed to generate audio:", error);
      toast({
        title: "Audio Generation Failed",
        description: "Could not generate audio for this message",
        variant: "destructive",
      });
      return null;
    }
  };

  const toggleMessageAudio = async (messageId: string, messageText?: string, theme?: string) => {
    let audioUrl = messageAudios.get(messageId);
    console.log(`Toggle audio for message ${messageId}:`, { 
      audioUrl: !!audioUrl, 
      isPlaying: playingMessageId === messageId,
      isPaused: pausedMessageId === messageId,
      hasAudioElement: messageAudioRefs.current.has(messageId)
    });
    
    // If no audio URL, try to generate it on-demand
    if (!audioUrl && messageText) {
      console.log("No audio found, generating on-demand...");
      toast({
        title: "Generating Audio",
        description: "Please wait...",
      });
      
      audioUrl = await generateAudioForMessage(messageId, messageText, theme || "");
      
      if (!audioUrl) {
        return; // Error already shown in generateAudioForMessage
      }
    } else if (!audioUrl) {
      console.log("No audio URL and no message text to generate from");
      toast({
        title: "Audio Not Available",
        description: "No audio data for this message",
        variant: "destructive",
      });
      return;
    }

    // If this message was paused, resume it
    if (pausedMessageId === messageId) {
      const audio = messageAudioRefs.current.get(messageId);
      if (audio && audio.paused) {
        try {
          await audio.play();
          setPlayingMessageId(messageId);
          setPausedMessageId(null);
          console.log(`Resumed audio for message ${messageId}`);
          return;
        } catch (error) {
          console.error("Failed to resume audio:", error);
          // If resume fails, start fresh
          messageAudioRefs.current.delete(messageId);
          setPausedMessageId(null);
        }
      }
    }

    // If this message is currently playing, pause it
    if (playingMessageId === messageId) {
      const audio = messageAudioRefs.current.get(messageId);
      if (audio && !audio.paused) {
        audio.pause();
        setPlayingMessageId(null);
        setPausedMessageId(messageId);
        console.log(`Paused audio for message ${messageId} (can be resumed)`);
        return;
      }
    }

    // Otherwise, play this message (will stop any other playing message)
    // Clear any paused state
    setPausedMessageId(null);
    await playMessageAudio(messageId, audioUrl);
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
      // If audio is currently playing, pause it
      if (isPlayingAudio && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlayingAudio(false);
        // Clean up URL if it exists
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
          setAudioUrl(null);
        }
        return;
      }

      // If we have cached audio URL, use it
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsPlayingAudio(false);
        };
        
        await audio.play();
        setIsPlayingAudio(true);
        return;
      }

      // Otherwise, fetch new audio
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
      
      await audio.play();
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
      // Cleanup all message audio URLs
      messageAudios.forEach(url => URL.revokeObjectURL(url));
      messageAudioRefs.current.forEach(audio => audio.pause());
    };
  }, [audioUrl, messageAudios]);

  // Auto-scroll to bottom when new messages arrive or when processing action
  useEffect(() => {
    if (chatScrollRef.current) {
      const scrollElement = chatScrollRef.current;
      // Scroll to bottom with smooth animation
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [narrativeHistory.length, processingAction]);

  // Load sidebar preferences from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("gameSessionSidebarCollapsed");
    const savedWidth = localStorage.getItem("gameSessionSidebarWidth");
    const savedNarrationHeight = localStorage.getItem("gameSessionNarrationHeight");
    
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === "true");
    }
    if (savedWidth !== null) {
      const width = parseInt(savedWidth, 10);
      if (width >= 200 && width <= 600) {
        setSidebarWidth(width);
      }
    }
    if (savedNarrationHeight !== null) {
      const height = parseInt(savedNarrationHeight, 10);
      if (height >= 20 && height <= 80) {
        setNarrationHeight(height);
      }
    }
  }, []);

  // Save sidebar preferences to localStorage
  useEffect(() => {
    localStorage.setItem("gameSessionSidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("gameSessionSidebarWidth", sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem("gameSessionNarrationHeight", narrationHeight.toString());
  }, [narrationHeight]);

  // Handle sidebar resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;
      
      const newWidth = e.clientX;
      const minWidth = 200;
      const maxWidth = 600;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // Handle narration section resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingNarration || !narrationRef.current) return;
      
      const container = narrationRef.current.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const offsetY = e.clientY - containerRect.top;
      const newHeightPercent = (offsetY / containerRect.height) * 100;
      
      const minHeight = 20;
      const maxHeight = 80;
      
      if (newHeightPercent >= minHeight && newHeightPercent <= maxHeight) {
        setNarrationHeight(newHeightPercent);
      }
    };

    const handleMouseUp = () => {
      setIsResizingNarration(false);
    };

    if (isResizingNarration) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingNarration]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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
  const currentActIndex = sessionState.current_act_index ?? 0;
  const currentQuestIndex = sessionState.current_quest_index ?? 0;
  
  // Get current act
  const currentAct = campaign?.acts?.[currentActIndex] || null;
  
  // Get all quests for current act
  const currentActQuests = currentAct && campaign?.quests?.[currentAct.act_title] || [];
  
  // Extract NPCs from active quest and campaign
  const npcs: string[] = [];
  if (activeQuest?.npcs) {
    npcs.push(...activeQuest.npcs);
  }
  // Also get NPCs from all quests in the campaign
  if (campaign?.quests) {
    Object.values(campaign.quests).forEach((quests: any) => {
      quests.forEach((quest: any) => {
        if (quest.npcs && Array.isArray(quest.npcs)) {
          quest.npcs.forEach((npc: string) => {
            if (!npcs.includes(npc)) {
              npcs.push(npc);
            }
          });
        }
      });
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="flex h-screen">
        {/* Sidebar - Campaign Info, Characters and NPCs */}
        <div
          ref={sidebarRef}
          className={`border-r bg-background/50 overflow-y-auto transition-all duration-300 relative ${
            sidebarCollapsed ? "w-16" : ""
          }`}
          style={{ width: sidebarCollapsed ? "64px" : `${sidebarWidth}px` }}
        >
          {/* Resize Handle */}
          {!sidebarCollapsed && (
            <div
              ref={resizeRef}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
              className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-accent/50 transition-colors z-10 group"
              title="Drag to resize"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-16 bg-accent/30 rounded-full group-hover:bg-accent/60 transition-colors" />
            </div>
          )}
          
          <div className="p-4 border-b">
            <div className={`flex items-center justify-between mb-4 ${sidebarCollapsed ? "flex-col gap-2" : ""}`}>
              {sidebarCollapsed ? (
                <>
                  <Button variant="ghost" size="icon" onClick={() => navigate("/")} title="Home">
                    <Home className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleSidebar} title="Expand sidebar">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="font-semibold font-fantasy-heading">Game Session</h2>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")} title="Home">
                      <Home className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} title="Collapse sidebar">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className={`${sidebarCollapsed ? "p-2" : "p-4"} space-y-4`}>
              {/* Campaign Context Section */}
              {campaign && !sidebarCollapsed && (
                <>
                  {/* Scene Narration - Collapsible */}
                  {!showSceneNarration && narration && (
                    <Card className="bg-gradient-to-br from-background/80 to-background/60 border-primary/20 mb-4">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Scroll className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-semibold">Scene</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSceneNarration(true)}
                            className="h-7 text-xs"
                          >
                            <ChevronRight className="h-3 w-3 mr-1" />
                            Expand
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground line-clamp-3">
                        {narration}
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    Campaign Progress
                  </div>
                  
                  {/* Current Act - Prominent Display */}
                  {currentAct && (
                    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 shadow-lg mb-4">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/20">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-bold text-foreground">
                                {currentAct.act_title || `Act ${currentActIndex + 1}`}
                              </CardTitle>
                              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                Act {currentActIndex + 1} of {campaign.acts?.length || 0}
                              </CardDescription>
                            </div>
                          </div>
                          <AchievementBadge type="act" label="Current" size="sm" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        {currentAct.act_summary && (
                          <p className="text-foreground leading-relaxed">{currentAct.act_summary}</p>
                        )}
                        {currentAct.narrative_goal && (
                          <div className="p-2 rounded-md bg-background/50 border border-border/50">
                            <div className="flex items-start gap-2">
                              <Target className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-foreground text-xs mb-1">Goal</div>
                                <div className="text-muted-foreground text-xs">{currentAct.narrative_goal}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {currentAct.primary_conflict && (
                          <div className="p-2 rounded-md bg-background/50 border border-border/50">
                            <div className="flex items-start gap-2">
                              <Sword className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-foreground text-xs mb-1">Conflict</div>
                                <div className="text-muted-foreground text-xs">{currentAct.primary_conflict}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {currentAct.key_locations && currentAct.key_locations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {currentAct.key_locations.map((loc: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {loc}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Active Quest - Prominent Display */}
                  {activeQuest && (
                    <Card className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-accent/30 shadow-lg mb-4">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-accent/20">
                              <Target className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-bold text-foreground">
                                {activeQuest.quest_name}
                              </CardTitle>
                              {activeQuest.quest_type && (
                                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                  {activeQuest.quest_type}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          <AchievementBadge type="quest" label="Active" size="sm" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        {activeQuest.description && (
                          <p className="text-foreground leading-relaxed">{activeQuest.description}</p>
                        )}
                        {activeQuest.quest_description && !activeQuest.description && (
                          <p className="text-foreground leading-relaxed">{activeQuest.quest_description}</p>
                        )}
                        
                        {activeQuest.objectives && activeQuest.objectives.length > 0 && (
                          <QuestProgress
                            objectives={activeQuest.objectives}
                            completedObjectives={sessionState.completed_objectives || []}
                          />
                        )}
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          {activeQuest.locations && activeQuest.locations.length > 0 && (
                            activeQuest.locations.map((loc: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {loc}
                              </Badge>
                            ))
                          )}
                          {activeQuest.location && !activeQuest.locations && (
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {activeQuest.location}
                            </Badge>
                          )}
                          {activeQuest.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {activeQuest.difficulty}
                            </Badge>
                          )}
                          {activeQuest.estimated_sessions && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {activeQuest.estimated_sessions} session{activeQuest.estimated_sessions > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        
                        {activeQuest.rewards && (
                          <div className="p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                            <div className="flex items-start gap-2">
                              <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-foreground text-xs mb-1">Rewards</div>
                                <div className="text-muted-foreground text-xs">{activeQuest.rewards}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* All Acts Overview - Collapsible */}
                  {campaign.acts && campaign.acts.length > 0 && (
                    <Card className="bg-background/50 border-border/50 mb-4">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Scroll className="h-4 w-4 text-primary" />
                          <CardTitle className="text-sm">All Acts</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {campaign.acts.map((act: any, idx: number) => {
                          const isCurrent = idx === currentActIndex;
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border transition-all ${
                                isCurrent
                                  ? "border-primary/50 bg-primary/5 shadow-sm"
                                  : idx < currentActIndex
                                  ? "border-green-500/30 bg-green-500/5"
                                  : "border-border/50 bg-background/50 opacity-60"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isCurrent
                                    ? "bg-primary text-primary-foreground"
                                    : idx < currentActIndex
                                    ? "bg-green-500 text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {isCurrent && (
                                      <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    )}
                                    {idx < currentActIndex && (
                                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                    )}
                                    <span className="font-semibold text-foreground text-xs truncate">
                                      {act.act_title || `Act ${idx + 1}`}
                                    </span>
                                  </div>
                                  {act.act_summary && (
                                    <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                                      {act.act_summary}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* All Quests in Current Act */}
                  {currentActQuests.length > 0 && (
                    <Card className="bg-background/50 border-border/50 mb-4">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Scroll className="h-4 w-4 text-primary" />
                          <CardTitle className="text-sm">
                            Quests in {currentAct?.act_title || `Act ${currentActIndex + 1}`}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {currentActQuests.map((quest: any, idx: number) => {
                          const isActive = activeQuest?.quest_name === quest.quest_name;
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border transition-all ${
                                isActive
                                  ? "border-accent/50 bg-accent/5 shadow-sm"
                                  : "border-border/50 bg-background/50 hover:bg-background/70"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {isActive && (
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-foreground text-xs">
                                      {quest.quest_name}
                                    </span>
                                    {isActive && (
                                      <Badge variant="outline" className="h-4 px-1.5 text-xs bg-accent/10 border-accent/30 text-accent">
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                  {quest.quest_type && (
                                    <div className="text-muted-foreground text-xs mb-1.5">
                                      {quest.quest_type}
                                    </div>
                                  )}
                                  {quest.description && (
                                    <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed mb-1.5">
                                      {quest.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {quest.difficulty && (
                                      <Badge variant="outline" className="h-4 px-1.5 text-xs">
                                        {quest.difficulty}
                                      </Badge>
                                    )}
                                    {quest.key_npcs && quest.key_npcs.length > 0 && (
                                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                                        <Users className="h-2.5 w-2.5 mr-1" />
                                        {quest.key_npcs.length} NPC{quest.key_npcs.length > 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                    {quest.npcs && quest.npcs.length > 0 && !quest.key_npcs && (
                                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                                        <Users className="h-2.5 w-2.5 mr-1" />
                                        {quest.npcs.length} NPC{quest.npcs.length > 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-6 pt-4 border-t">
                    Characters & NPCs
                  </div>
                </>
              )}
              
              {/* Collapsed State - Show Icons Only */}
              {sidebarCollapsed && campaign && (
                <div className="space-y-3">
                  {currentAct && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full"
                      title={`${currentAct.act_title || `Act ${currentActIndex + 1}`} - Current Act`}
                    >
                      <BookOpen className="h-5 w-5 text-primary" />
                    </Button>
                  )}
                  {activeQuest && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full"
                      title={`${activeQuest.quest_name} - Active Quest`}
                    >
                      <Target className="h-5 w-5 text-accent" />
                    </Button>
                  )}
                  {playerCharacters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full"
                      title={`${playerCharacters.length} Player${playerCharacters.length > 1 ? 's' : ''}`}
                    >
                      <Users className="h-5 w-5" />
                    </Button>
                  )}
                  {npcs.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full"
                      title={`${npcs.length} NPC${npcs.length > 1 ? 's' : ''}`}
                    >
                      <Crown className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              )}
              
              {/* Player Characters Section */}
              {playerCharacters.length > 0 && !sidebarCollapsed && (
                <>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Players ({playerCharacters.length})
                  </div>
                  {playerCharacters.map((char: any) => {
                const charData = char.data || {};
                const combatStats = charData.combat_stats || {};
                // Check for image in various possible locations
                const imageBase64 = charData.portrait?.image_base64 || charData.image_base64 || char.image_base64 || null;
                const portraitImageUrl = charData.portrait?.image_url || charData.portrait_image_url || charData.portrait_url || null;
                
                return (
                  <Card 
                    key={char.id} 
                    className={`character-card-hover ${
                      selectedCharacter === char.character_name 
                        ? "border-primary border-2 shadow-lg shadow-primary/20" 
                        : "border-border"
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{char.character_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {charData.race} {charData.class_and_level}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {/* Player Character Image */}
                      {imageBase64 && (
                        <div className="mb-2">
                          <img
                            src={`data:image/png;base64,${imageBase64}`}
                            alt={`Portrait of ${char.character_name}`}
                            className="w-full h-auto rounded-lg border border-border/50 shadow-md"
                          />
                        </div>
                      )}
                      {!imageBase64 && portraitImageUrl && (
                        <div className="mb-2">
                          <img
                            src={portraitImageUrl}
                            alt={`Portrait of ${char.character_name}`}
                            className="w-full h-auto rounded-lg border border-border/50 shadow-md"
                          />
                        </div>
                      )}
                      {/* Health Bar */}
                      {combatStats.hit_point_maximum && (
                        <HealthBar
                          current={combatStats.current_hit_points || combatStats.hit_point_maximum}
                          max={combatStats.hit_point_maximum}
                          label="Health"
                          showNumbers={true}
                        />
                      )}
                      
                      {/* AC Display */}
                      {combatStats.armor_class && (
                        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border/50">
                          <span className="text-xs font-semibold text-foreground">Armor Class</span>
                          <Badge variant="outline" className="font-mono font-bold">
                            {combatStats.armor_class}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Ability Scores - Gamified */}
                      {charData.abilities && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Abilities
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <StatDisplay
                              label="STR"
                              value={charData.abilities.strength}
                              highlight={selectedCharacter === char.character_name}
                            />
                            <StatDisplay
                              label="DEX"
                              value={charData.abilities.dexterity}
                              highlight={selectedCharacter === char.character_name}
                            />
                            <StatDisplay
                              label="CON"
                              value={charData.abilities.constitution}
                              highlight={selectedCharacter === char.character_name}
                            />
                            <StatDisplay
                              label="INT"
                              value={charData.abilities.intelligence}
                              highlight={selectedCharacter === char.character_name}
                            />
                            <StatDisplay
                              label="WIS"
                              value={charData.abilities.wisdom}
                              highlight={selectedCharacter === char.character_name}
                            />
                            <StatDisplay
                              label="CHA"
                              value={charData.abilities.charisma}
                              highlight={selectedCharacter === char.character_name}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
                </>
              )}
              
              {/* NPCs Section */}
              {npcs.length > 0 && !sidebarCollapsed && (
                <>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-6 pt-4 border-t">
                    NPCs
                  </div>
                  {npcs.map((npcName: string, index: number) => {
                    // Get NPC description from campaign data if available
                    const npcDescription = campaign?.npcs?.find((npc: any) => npc.name === npcName)?.description 
                      || `NPC from ${campaign?.title || 'the campaign'}`;
                    const questContext = activeQuest 
                      ? `Quest: ${activeQuest.quest_name} | Campaign: ${campaign?.title || ''}`
                      : `Campaign: ${campaign?.title || ''}`;
                    
                    // Find which quests this NPC is in
                    const npcQuests: string[] = [];
                    if (campaign?.quests) {
                      Object.values(campaign.quests).forEach((quests: any) => {
                        quests.forEach((quest: any) => {
                          if (quest.npcs && Array.isArray(quest.npcs) && quest.npcs.includes(npcName)) {
                            npcQuests.push(quest.quest_name);
                          }
                        });
                      });
                    }
                    
                    return (
                      <Card key={`npc-${index}`} className="bg-accent/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{npcName}</CardTitle>
                          <CardDescription className="text-xs">
                            Non-Player Character
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {activeQuest?.npcs?.includes(npcName) && (
                            <div className="text-accent text-xs mb-2 font-semibold">
                              ✓ Active in current quest
                            </div>
                          )}
                          {npcQuests.length > 0 && (
                            <div className="text-xs mb-2">
                              <span className="font-semibold text-foreground">Appears in: </span>
                              <span className="text-muted-foreground">
                                {npcQuests.join(", ")}
                              </span>
                            </div>
                          )}
                          {/* NPC Image Generator */}
                          <NPCImageGenerator
                            npcName={npcName}
                            npcDescription={npcDescription}
                            questContext={questContext}
                            campaignId={campaign?.id?.toString()}
                            className="text-xs"
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              )}
              
              {playerCharacters.length === 0 && npcs.length === 0 && !sidebarCollapsed && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No characters or NPCs found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-border/50 bg-gradient-to-r from-background via-background to-primary/5 p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="h-6 w-6 text-primary" />
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {campaign.title}
                      </h1>
                    {/* Campaign Context Badges */}
                    <div className="flex items-center gap-3 mt-2">
                      {currentAct && (
                        <div className="flex items-center gap-1 text-xs">
                          <BookOpen className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">Act: </span>
                          <span className="text-foreground font-medium">{currentAct.act_title}</span>
                        </div>
                      )}
                      {activeQuest && (
                        <div className="flex items-center gap-1 text-xs">
                          <Target className="h-3 w-3 text-accent" />
                          <span className="text-muted-foreground">Quest: </span>
                          <span className="text-foreground font-medium">{activeQuest.quest_name}</span>
                        </div>
                      )}
                      {activeQuest?.location && (
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{activeQuest.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Turn Order Display */}
                {turnOrder.length > 0 && (
                  <div className="flex items-center gap-3 ml-9 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Turn Order:</span>
                      <div className="flex items-center gap-1">
                        {turnOrder.map((name, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-full font-medium transition-all ${
                              name === currentTurn
                                ? "bg-primary text-primary-foreground ring-2 ring-primary/50 turn-active shadow-lg shadow-primary/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Current Turn:</span>{" "}
                      <span className="text-primary font-bold">{currentTurn}</span>
                    </div>
                  </div>
                )}
              </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSave}
                  className="game-button border-border hover:bg-accent/20"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Game
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    // Force regenerate narration
                    try {
                      const scene = await narrateScene(parseInt(sessionId!), true);
                      if (scene && scene.narration) {
                        setNarration(scene.narration);
                        prepareNarrationForHighlighting(scene.narration);
                        if (scene.audio_data) {
                          await playAudioFromBase64(scene.audio_data);
                        }
                      }
                    } catch (error) {
                      console.error("Error refreshing scene:", error);
                      toast({
                        title: "Error",
                        description: "Failed to refresh scene narration",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="game-button border-border hover:bg-primary/20"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Refresh Scene
                </Button>
              </div>
            </div>
          </div>

          {/* Content Container - Unified Chat Interface */}
          <div className="flex-1 flex flex-col overflow-hidden relative p-6">
            {/* Unified Story Chat with Integrated Actions */}
            <Card className="flex-1 flex flex-col border-2 border-primary/20 shadow-xl bg-card/95 backdrop-blur-sm overflow-hidden">
              {/* Chat Header */}
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Story Chat</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={currentTurn === "DM" ? "default" : "secondary"} className="text-xs">
                      Turn: {currentTurn}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages - Scrollable */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <div ref={chatScrollRef} className="p-6 space-y-3">
                    {narrativeHistory.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No messages yet</p>
                        <p className="text-sm mt-2">The story will unfold here as you play</p>
                      </div>
                    ) : (
                      <>
                        {/* Sort messages by timestamp to ensure chronological order */}
                        {(() => {
                          const sorted = [...narrativeHistory].sort((a, b) => {
                            const aTime = new Date(a.timestamp).getTime();
                            const bTime = new Date(b.timestamp).getTime();
                            console.log(`⏰ Sorting: ${a.type} (${a.timestamp}) vs ${b.type} (${b.timestamp}) => ${aTime - bTime}`);
                            return aTime - bTime;
                          });
                          console.log("📋 Final sorted order:", sorted.map((e, i) => `${i}. ${e.type} @ ${e.timestamp}`));
                          return sorted;
                        })().map((event, idx) => {
                          const isDM = event.type === 'dm_narration' || event.type === 'scene_narration';
                          const isPlayer = event.type === 'player_action';
                          const isDiceRoll = event.type === 'dm_dice_roll';
                          
                          // Use timestamp as unique ID for audio mapping
                          const messageId = event.timestamp;
                          const hasAudio = messageAudios.has(messageId);
                          const isPlaying = playingMessageId === messageId;
                          const isPaused = pausedMessageId === messageId;

                          if (isDM) {
                            console.log(`📧 DM Message ${idx}:`, {
                              messageId,
                              type: event.type,
                              hasAudio,
                              isPlaying,
                              isPaused,
                              timestamp: event.timestamp,
                              content: event.content?.substring(0, 50) + '...'
                            });
                          }

                          // Skip dice roll events - they're included in the narration
                          if (isDiceRoll) return null;

                          if (!isDM && !isPlayer) return null;

                        return (
                          <div 
                            key={idx} 
                            className={`flex gap-3 ${isPlayer ? 'justify-end' : 'justify-start'}`}
                          >
                            {/* DM Avatar */}
                            {isDM && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                DM
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div className={`max-w-[75%] rounded-lg p-3 ${
                              isPlayer 
                                ? 'bg-blue-600/20 border border-blue-500/30' 
                                : 'bg-purple-600/20 border border-purple-500/30'
                            }`}>
                              {/* Message Header */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-foreground">
                                  {isDM ? 'Dungeon Master' : event.metadata?.action?.character_name || 'Player'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                                {isDM && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      console.log("🔊 Voice button clicked!");
                                      console.log("  Message ID:", messageId);
                                      console.log("  Has audio:", hasAudio);
                                      console.log("  Is playing:", isPlaying);
                                      console.log("  Is paused:", pausedMessageId === messageId);
                                      console.log("  Message text:", event.content?.substring(0, 50));
                                      console.log("  Campaign theme:", campaign?.theme);
                                      
                                      // Toggle audio - will generate on-demand if not available
                                      await toggleMessageAudio(messageId, event.content, campaign?.theme || "");
                                    }}
                                    disabled={false}
                                    className={`h-8 w-8 p-0 hover:bg-primary/30 active:bg-primary/40 ml-auto rounded-full transition-all cursor-pointer hover:scale-110 ${
                                      !hasAudio ? 'opacity-50 bg-amber-500/20' : 
                                      isPlaying ? 'bg-blue-500/30 animate-pulse' :
                                      pausedMessageId === messageId ? 'bg-yellow-500/30' :
                                      'bg-green-500/20'
                                    }`}
                                    title={
                                      !hasAudio ? "🎵 Generate & play audio" :
                                      isPlaying ? "⏸️ Pause narration" :
                                      pausedMessageId === messageId ? "▶️ Resume narration" :
                                      "▶️ Play narration"
                                    }
                                  >
                                    {isPlaying ? (
                                      <Pause className="h-5 w-5 text-blue-500 animate-pulse" />
                                    ) : pausedMessageId === messageId ? (
                                      <Play className="h-5 w-5 text-yellow-500" />
                                    ) : hasAudio ? (
                                      <Volume2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <Volume2 className="h-5 w-5 text-amber-500" />
                                    )}
                                  </Button>
                                )}
                              </div>

                              {/* Message Content */}
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {event.content}
                              </p>

                              {/* Player Action Type Badge */}
                              {isPlayer && event.metadata?.action?.action_type && (
                                <div className="mt-2">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200">
                                    {event.metadata.action.action_type.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Player Avatar */}
                            {isPlayer && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                                {(event.metadata?.action?.character_name || 'P').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* DM is typing indicator */}
                      {processingAction && (
                        <div className="flex gap-3 justify-start animate-fade-in">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            DM
                          </div>
                          <div className="max-w-[75%] rounded-lg p-3 bg-purple-600/20 border border-purple-500/30">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Dungeon Master</span>
                              <span className="text-xs text-muted-foreground">is typing</span>
                            </div>
                            <div className="flex gap-1 mt-2">
                              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        </div>
                      )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Action Input Area - Always at bottom */}
              <div className="border-t border-border/50 bg-background/50 p-4 flex-shrink-0">
                {currentTurn === "DM" ? (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
                    <p className="text-lg font-semibold text-foreground">Dungeon Master's Turn</p>
                    <p className="text-sm mt-2 text-muted-foreground">The DM has set the scene...</p>
                    <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg max-w-md mx-auto">
                      <p className="text-sm font-medium text-foreground mb-2">What's happening:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 text-left">
                        <li>• Scene narration and world building</li>
                        <li>• NPC interactions and dialogue</li>
                        <li>• Environmental descriptions</li>
                        <li>• Quest progression and updates</li>
                      </ul>
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <Button
                          onClick={handleBeginPlayerTurn}
                          disabled={processingAction}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        >
                          {processingAction ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Ready - Begin Player Turns
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : currentTurn !== selectedCharacter ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 text-accent/50" />
                    <p className="text-lg font-semibold">Waiting for {currentTurn}...</p>
                    <p className="text-sm mt-2">It's not your turn yet. Please wait.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground font-semibold">Character</Label>
                        <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                          <SelectTrigger className="bg-background text-foreground border-border">
                            <SelectValue placeholder="Select character" />
                          </SelectTrigger>
                          <SelectContent>
                            {playerCharacters.map((char: any) => (
                              <SelectItem key={char.id} value={char.character_name}>
                                {char.character_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-semibold">Action Type</Label>
                    <Select value={actionType} onValueChange={setActionType}>
                      <SelectTrigger className="bg-background text-foreground border-border">
                        <SelectValue placeholder="Select action type" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Action Description</Label>
                  <Textarea
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    placeholder="Describe what you want to do..."
                    rows={3}
                    className="bg-background text-foreground border-border placeholder:text-muted-foreground"
                  />
                </div>
                    <Button
                      onClick={handleAction}
                      disabled={processingAction || !selectedCharacter || !actionDescription.trim() || currentTurn !== selectedCharacter}
                      className="game-button w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold h-11 shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      {processingAction ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Action...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Take Action
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSession;

