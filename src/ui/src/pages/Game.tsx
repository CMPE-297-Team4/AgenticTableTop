import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, MapPin, Users, Clock, Star, Target, AlertTriangle, CheckCircle, Sword, Shield, Scroll, BookOpen, Compass, Crown, Gem, Flame, Zap, Eye, Heart, Skull, Crosshair, Trophy, Key, Lock, Trash2, Home, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import type { Campaign } from "@/services/campaignApi";
import { NPCImageGenerator } from "@/components/NPCImageGenerator";
import { NPCImageCache } from "@/utils/npcImageCache";
import { useAuth } from "@/contexts/AuthContext";
import monsterImage from "@/assets/dnd-monster.png";

const Game = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [currentActIndex, setCurrentActIndex] = useState(0);
  const [cacheStats, setCacheStats] = useState({ totalCached: 0, totalSize: 0 });
  const [currentSection, setCurrentSection] = useState<string>("story");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Update cache stats
  const updateCacheStats = () => {
    const stats = NPCImageCache.getCacheStats();
    setCacheStats(stats);
  };

  // Clear all cache
  const handleClearAllCache = () => {
    NPCImageCache.clearAllCache();
    updateCacheStats();
    // Force re-render of NPC components by updating a dummy state
    setCurrentActIndex(prev => prev);
  };

  // Cleanup expired cache
  const handleCleanupCache = () => {
    const cleaned = NPCImageCache.cleanupExpiredCache();
    updateCacheStats();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`);
    }
  };

  useEffect(() => {
    // Load campaign from sessionStorage
    const campaignData = sessionStorage.getItem("currentCampaign");
    if (!campaignData) {
      navigate("/");
      return;
    }
    
    try {
      const parsedCampaign = JSON.parse(campaignData);
      setCampaign(parsedCampaign);
    } catch (error) {
      console.error("Error parsing campaign data:", error);
      navigate("/");
    }

    // Update cache stats on mount
    updateCacheStats();
  }, [navigate]);

  const handleBack = () => {
    navigate("/");
  };

  const scrollToSection = (sectionId: string) => {
    // Find the main content area instead of scrolling the entire page
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      const element = mainContent.querySelector(`[data-section="${sectionId}"]`);
      if (element) {
        // Scroll within the main content area
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setCurrentSection(sectionId);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <p className="text-foreground">Loading campaign...</p>
      </div>
    );
  }

  const currentAct = campaign.acts[currentActIndex];
  const currentQuests = campaign.quests[currentAct.title] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex flex-col relative overflow-hidden fantasy-bg">
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
        <div className="absolute top-1/5 left-1/5 w-1 h-1 bg-primary/25 rounded-full floating-particle" style={{animationDelay: '7s'}}></div>
        <div className="absolute bottom-1/5 right-1/5 w-1.5 h-1.5 bg-accent/20 rounded-full floating-particle" style={{animationDelay: '8s'}}></div>
      </div>
      
      {/* Magical Shine Effect */}
      <div className="absolute inset-0 magical-shine"></div>
      
      {/* Header */}
      <header className={`bg-background/20 border-b-2 border-border/30 p-4 flex justify-between items-center shadow-lg gaming-glow relative z-10 backdrop-blur-sm transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'}`}>
        {/* Banner-specific floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 left-1/4 w-1 h-1 bg-primary-foreground/20 rounded-full floating-particle"></div>
          <div className="absolute top-3 right-1/3 w-1.5 h-1.5 bg-accent-foreground/15 rounded-full floating-particle" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-2 left-1/2 w-1 h-1 bg-primary-foreground/25 rounded-full floating-particle" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-serif text-foreground tracking-wider gaming-glow">
            {campaign.title}
        </h1>
          <p className="text-sm text-foreground/80">{campaign.theme}</p>
        </div>
        <div className="flex space-x-2 relative z-10">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => scrollToSection("character-gallery")}
            className="border-border/50 text-foreground hover:bg-accent/20 hover:text-accent-foreground gaming-glow"
          >
            <Heart className="mr-2 h-4 w-4" />
            Character Gallery
          </Button>
          <Button variant="outline" size="sm" onClick={handleBack} className="border-border/50 text-foreground hover:bg-accent/20 hover:text-accent-foreground gaming-glow">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Generator
          </Button>
          <Button variant="outline" size="sm" onClick={logout} className="border-border/50 text-foreground hover:bg-accent/20 hover:text-accent-foreground gaming-glow">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Panel - Breadcrumb Navigation */}
        <aside className={`bg-background/20 border-r-2 border-border/30 flex flex-col backdrop-blur-sm transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-80'} fixed left-0 top-0 h-screen z-20`}>
          {/* Sidebar Header with Toggle */}
          <div className="p-3 border-b border-border/30 flex items-center justify-between min-w-0">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2 text-sm min-w-0 flex-1 sidebar-breadcrumb-container">
                <Home className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-foreground/60 flex-shrink-0">/</span>
                <span className="font-medium text-foreground sidebar-breadcrumb">{campaign.title}</span>
                {currentActIndex >= 0 && currentActIndex < campaign.acts.length && (
                  <>
                    <span className="text-foreground/60 flex-shrink-0">/</span>
                    <span className="font-medium text-accent sidebar-breadcrumb">{campaign.acts[currentActIndex].title}</span>
                  </>
                )}
              </div>
            )}
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Toggle sidebar clicked, current state:', sidebarCollapsed);
                toggleSidebar();
              }}
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-accent/20 h-8 w-8 p-0 flex-shrink-0 cursor-pointer sidebar-button"
              title={sidebarCollapsed ? "Show Navigation" : "Hide Navigation"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Quick Navigation */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-border/30">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <Compass className="mr-2 h-4 w-4 text-accent" />
                Quick Jump
              </h3>
              <div className="space-y-1">
                <Button
                  onClick={() => scrollToSection("story")}
                  variant={currentSection === "story" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                >
                  <BookOpen className="mr-2 h-3 w-3" />
                  Campaign Story
                </Button>
                <Button
                  onClick={() => scrollToSection("character-gallery")}
                  variant={currentSection === "character-gallery" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                >
                  <Heart className="mr-2 h-3 w-3" />
                  Character Gallery
                </Button>
                <Button
                  onClick={() => scrollToSection("acts")}
                  variant={currentSection === "acts" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                >
                  <Crown className="mr-2 h-3 w-3" />
                  Select Act
                </Button>
                <Button
                  onClick={() => {
                    scrollToSection("quests");
                    // Also switch to quests tab
                    const questsTab = document.querySelector('[value="quests"]') as HTMLButtonElement;
                    if (questsTab) {
                      questsTab.click();
                    }
                  }}
                  variant={currentSection === "quests" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                >
                  <Trophy className="mr-2 h-3 w-3" />
                  Quests
                </Button>
          </div>
            </div>
          )}

          {/* Campaign Image */}
          <div className="h-32 bg-accent border-b-2 border-border flex items-center justify-center overflow-hidden">
            <img src={monsterImage} alt="D&D Campaign" className="w-full h-full object-cover" />
          </div>

          {/* Collapsed State - Show only icons */}
          {sidebarCollapsed && (
            <div className="flex flex-col items-center space-y-4 p-2">
              {/* Toggle button at top when collapsed */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Toggle sidebar clicked (collapsed), current state:', sidebarCollapsed);
                  toggleSidebar();
                }}
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-accent/20 h-10 w-10 p-0 cursor-pointer sidebar-button"
                title="Show Navigation"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => scrollToSection("story")}
                variant={currentSection === "story" ? "default" : "ghost"}
                size="sm"
                className="h-10 w-10 p-0"
                title="Campaign Story"
              >
                <BookOpen className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => scrollToSection("character-gallery")}
                variant={currentSection === "character-gallery" ? "default" : "ghost"}
                size="sm"
                className="h-10 w-10 p-0"
                title="Character Gallery"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => scrollToSection("acts")}
                variant={currentSection === "acts" ? "default" : "ghost"}
                size="sm"
                className="h-10 w-10 p-0"
                title="Select Act"
              >
                <Crown className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  scrollToSection("quests");
                  // Also switch to quests tab
                  const questsTab = document.querySelector('[value="quests"]') as HTMLButtonElement;
                  if (questsTab) {
                    questsTab.click();
                  }
                }}
                variant={currentSection === "quests" ? "default" : "ghost"}
                size="sm"
                className="h-10 w-10 p-0"
                title="Quests"
              >
                <Trophy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </aside>

        {/* Right Panel - Campaign Content */}
        <div className={`flex-1 flex flex-col main-content overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'}`}>
          <Tabs defaultValue="story" className="flex-1 flex flex-col">
            <TabsList className="m-4 mb-0 bg-background/20 border-border/30 gaming-glow backdrop-blur-sm">
              <TabsTrigger 
                value="story" 
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-card-foreground transition-all duration-300 hover:shadow-lg"
                onClick={() => setCurrentSection("story")}
              >
                Campaign Story
              </TabsTrigger>
              <TabsTrigger 
                value="quests" 
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-card-foreground transition-all duration-300 hover:shadow-lg"
                onClick={() => setCurrentSection("quests")}
              >
                Quests ({currentQuests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="flex-1 m-4">
              <Card className="h-full p-6 bg-background/20 border-border/30 gaming-glow backdrop-blur-sm">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    {/* Background Story Section */}
                    <div className="mb-8">
                      <div className="flex items-center mb-6">
                        <Scroll className="mr-3 h-8 w-8 text-accent" />
                        <h3 className="text-2xl font-bold text-foreground font-serif tracking-wide">The Tale Begins</h3>
                </div>
                      
                      <div className="relative">
                        {/* Mystical background effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 rounded-xl"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent rounded-xl"></div>
                        
                        {/* Story content */}
                        <div className="relative bg-background/30 backdrop-blur-sm p-8 rounded-xl border border-accent/30 story-border">
                          <div className="text-base leading-relaxed text-foreground font-serif tracking-wide whitespace-pre-wrap mystical-text">
                            {campaign.background || campaign.background_story}
                </div>
                          
                          {/* Decorative elements */}
                          <div className="absolute top-4 left-4 w-2 h-2 bg-accent/40 rounded-full"></div>
                          <div className="absolute top-4 right-4 w-2 h-2 bg-primary/40 rounded-full"></div>
                          <div className="absolute bottom-4 left-4 w-2 h-2 bg-primary/40 rounded-full"></div>
                          <div className="absolute bottom-4 right-4 w-2 h-2 bg-accent/40 rounded-full"></div>
                </div>
              </div>
            </div>

                    {/* DM Session Guide Section */}
                    <div className="mb-8">
                      <div className="flex items-center mb-6">
                        <Crown className="mr-3 h-8 w-8 text-accent" />
                        <h3 className="text-2xl font-bold text-foreground font-serif tracking-wide">Dungeon Master's Guide</h3>
          </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Player Characters Section */}
                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-xl border border-accent/30 story-border">
                          <div className="flex items-center mb-4">
                            <Users className="mr-2 h-6 w-6 text-primary" />
                            <h4 className="text-xl font-bold text-foreground">Player Characters</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-primary-foreground">Sample Party</span>
                                <Badge className="bg-primary text-primary-foreground">Level 1-3</Badge>
                              </div>
                              <p className="text-sm text-primary-foreground/80">
                                Ready for adventure! Each player should have their character sheet ready.
                              </p>
                            </div>
                            <div className="text-sm text-foreground/70 italic">
                              💡 Tip: Ask players to introduce their characters before starting Act I
                            </div>
                          </div>
                        </div>

                        {/* Key NPCs Section */}
                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-xl border border-accent/30 story-border">
                          <div className="flex items-center mb-4">
                            <Heart className="mr-2 h-6 w-6 text-accent" />
                            <h4 className="text-xl font-bold text-foreground">Key NPCs</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-accent/10 p-3 rounded-lg border border-accent/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-accent-foreground">Story NPCs</span>
                                <Badge className="bg-accent text-accent-foreground">Important</Badge>
                              </div>
                              <p className="text-sm text-accent-foreground/80">
                                NPCs will be introduced as the story unfolds. Check each quest for specific NPCs.
                              </p>
                            </div>
                            <div className="text-sm text-foreground/70 italic">
                              💡 Tip: Prepare NPC voices and motivations before each session
                            </div>
                          </div>
            </div>
          </div>

                      {/* Next Steps Section */}
                      <div className="mt-6 bg-gradient-to-r from-accent/10 to-primary/10 backdrop-blur-sm p-6 rounded-xl border border-accent/30 story-border">
                        <div className="flex items-center mb-4">
                          <Target className="mr-2 h-6 w-6 text-orange-500" />
                          <h4 className="text-xl font-bold text-foreground">Next Steps for Session</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-background/50 p-4 rounded-lg border border-border">
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground mr-2">1</div>
                              <span className="font-semibold text-foreground">Read the Story</span>
                            </div>
                            <p className="text-sm text-foreground/80">Share the background story with your players to set the scene.</p>
                          </div>
                          <div className="bg-background/50 p-4 rounded-lg border border-border">
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-xs font-bold text-accent-foreground mr-2">2</div>
                              <span className="font-semibold text-foreground">Start Act I</span>
                            </div>
                            <p className="text-sm text-foreground/80">Begin with the first quest of Act I. Check the quest details below.</p>
                          </div>
                          <div className="bg-background/50 p-4 rounded-lg border border-border">
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white mr-2">3</div>
                              <span className="font-semibold text-foreground">Track Progress</span>
                            </div>
                            <p className="text-sm text-foreground/80">Mark completed quests and move through acts as players progress.</p>
                          </div>
              </div>
              </div>
            </div>

                    {/* NPC Gallery Section */}
                    <div className="mb-8" data-section="character-gallery">
                      <div className="flex items-center mb-6">
                        <Heart className="mr-3 h-8 w-8 text-accent" />
                        <div>
                          <h3 className="text-2xl font-bold text-foreground font-serif tracking-wide">Character Gallery</h3>
                          {currentActIndex >= 0 && currentActIndex < campaign.acts.length && (
                            <p className="text-sm text-foreground/70 mt-1">
                              Showing NPCs from <span className="font-semibold text-accent">{campaign.acts[currentActIndex].title}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-background/30 backdrop-blur-sm p-6 rounded-xl border border-accent/30 story-border">
                        <div className="mb-4">
                          <p className="text-sm text-foreground/80 mb-4">
                            {currentActIndex >= 0 && currentActIndex < campaign.acts.length 
                              ? `Generate portraits for NPCs in ${campaign.acts[currentActIndex].title}. These characters are specific to this act and will be important for your players.`
                              : "Generate portraits for key NPCs in your campaign. Select an act to see act-specific NPCs, or view all campaign NPCs here."
                            }
                          </p>
                          
                          {/* Cache Management */}
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                            <div className="flex items-center space-x-4">
                              <div className="text-xs text-foreground/70">
                                <span className="font-semibold">Cache:</span> {cacheStats.totalCached} images 
                                ({Math.round(cacheStats.totalSize / 1024)}KB)
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={handleCleanupCache}
                                size="sm"
                                variant="outline"
                                className="text-xs border-border/50 text-foreground hover:bg-accent/20 hover:text-accent-foreground"
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Cleanup
                              </Button>
                              <Button
                                onClick={handleClearAllCache}
                                size="sm"
                                variant="outline"
                                className="text-xs border-red-500/50 text-red-500 hover:bg-red-500/20 hover:text-red-600"
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Clear All
                </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Show Key NPCs based on selected act */}
                        {(() => {
                          let relevantNPCs = new Set<string>();
                          let actTitle = "All Acts";
                          let actDescription = "NPCs from the entire campaign";
                          
                          if (currentActIndex >= 0 && currentActIndex < campaign.acts.length) {
                            const selectedAct = campaign.acts[currentActIndex];
                            actTitle = selectedAct.title;
                            actDescription = `NPCs from ${selectedAct.title}`;
                            
                            // Get NPCs from quests in the selected act
                            const actQuests = campaign.quests[selectedAct.title] || [];
                            actQuests.forEach(quest => {
                              if (quest.npcs) {
                                quest.npcs.forEach(npc => relevantNPCs.add(npc));
                              }
                            });
                            
                            // If no NPCs found in this act, fall back to all NPCs
                            if (relevantNPCs.size === 0) {
                              Object.values(campaign.quests).forEach(quests => {
                                quests.forEach(quest => {
                                  if (quest.npcs) {
                                    quest.npcs.forEach(npc => relevantNPCs.add(npc));
                                  }
                                });
                              });
                              actTitle = "All Acts";
                              actDescription = "No NPCs found in selected act, showing all campaign NPCs";
                            }
                          } else {
                            // No act selected, show all NPCs
                            Object.values(campaign.quests).forEach(quests => {
                              quests.forEach(quest => {
                                if (quest.npcs) {
                                  quest.npcs.forEach(npc => relevantNPCs.add(npc));
                                }
                              });
                            });
                            actDescription = "Select an act to see act-specific NPCs";
                          }
                          
                          const npcArray = Array.from(relevantNPCs);
                          
                          if (npcArray.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No NPCs found in this campaign.</p>
                              </div>
                            );
                          }
                          
                          // Show only the first 6 NPCs to keep it manageable
                          const displayNPCs = npcArray.slice(0, 6);
                          const hasMore = npcArray.length > 6;
                          
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground">{actTitle} NPCs</h4>
                                  <p className="text-xs text-foreground/70">
                                    {displayNPCs.length} of {npcArray.length} NPCs shown
                                  </p>
                                  <p className="text-xs text-foreground/60 italic">
                                    {actDescription}
                                  </p>
                                </div>
                                {hasMore && (
                                  <Badge variant="outline" className="text-xs">
                                    +{npcArray.length - 6} more
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 character-gallery">
                                {displayNPCs.map((npc, index) => (
                                  <div key={index} className="bg-background/50 p-4 rounded-lg border border-border/50">
                                    <NPCImageGenerator
                                      npcName={npc}
                                      npcDescription={`NPC from ${actTitle} in ${campaign.title} campaign`}
                                      questContext={`Act: ${actTitle} | Campaign: ${campaign.title} | Theme: ${campaign.theme}`}
                                      className=""
                                    />
                                  </div>
                                ))}
                              </div>
                              
                              {hasMore && (
                                <div className="text-center py-4">
                                  <p className="text-sm text-muted-foreground">
                                    Additional NPCs are available in individual quest details
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Acts Selection Section */}
                    <div className="border-t border-border pt-6" data-section="acts">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-card-foreground">Campaign Acts</h3>
                        <Badge className="bg-accent text-accent-foreground">
                          {campaign.acts.length} Acts Available
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {campaign.acts.map((act, index) => (
                          <Card 
                            key={index} 
                            className={`p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                              currentActIndex === index 
                                ? 'act-highlight border-accent' 
                                : 'border-border bg-card hover:border-accent/50'
                            }`}
                            onClick={() => setCurrentActIndex(index)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                  currentActIndex === index 
                                    ? 'bg-accent text-accent-foreground' 
                                    : 'bg-card text-card-foreground'
                                }`}>
                                  {index + 1}
                                </div>
                                <h4 className="text-lg font-semibold text-card-foreground">
                                  Act {index + 1}
                                </h4>
                              </div>
                              {currentActIndex === index && (
                                <Crown className="h-5 w-5 text-accent" />
                              )}
                            </div>
                            
                            <h5 className="font-semibold text-card-foreground mb-2">{act.title}</h5>
                            <p className="text-sm text-muted-foreground mb-3 italic line-clamp-3">{act.summary}</p>
                            
                <div className="space-y-2">
                              <div className="flex items-center text-xs text-orange-600 dark:text-orange-400">
                                <Target className="mr-1 h-3 w-3" />
                                <span className="truncate">{act.goal}</span>
                              </div>
                              <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                <span className="truncate">{act.stakes}</span>
                              </div>
                              {act.locations && act.locations.length > 0 && (
                                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                                  <MapPin className="mr-1 h-3 w-3" />
                                  <span>{act.locations.length} locations</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-border">
                              <Button
                                variant={currentActIndex === index ? "default" : "outline"}
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentActIndex(index);
                                }}
                              >
                                {currentActIndex === index ? (
                                  <>
                                    <Crown className="mr-1 h-3 w-3" />
                                    Current Act
                                  </>
                                ) : (
                                  <>
                                    <Compass className="mr-1 h-3 w-3" />
                                    Select Act
                                  </>
                                )}
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                      
                      {currentActIndex >= 0 && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/30">
                          <div className="flex items-center mb-3">
                            <Crown className="mr-2 h-5 w-5 text-accent" />
                            <h4 className="text-lg font-semibold text-card-foreground">
                              Selected: Act {currentActIndex + 1} - {campaign.acts[currentActIndex].title}
                            </h4>
                          </div>
                          <p className="text-sm text-card-foreground mb-3">
                            {campaign.acts[currentActIndex].summary}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center text-orange-600 dark:text-orange-400">
                              <Target className="mr-1 h-4 w-4" />
                              <span>Goal: {campaign.acts[currentActIndex].goal}</span>
                            </div>
                            <div className="flex items-center text-red-600 dark:text-red-400">
                              <AlertTriangle className="mr-1 h-4 w-4" />
                              <span>Stakes: {campaign.acts[currentActIndex].stakes}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Button
                              onClick={() => {
                                const questsTab = document.querySelector('[value="quests"]');
                                if (questsTab) {
                                  (questsTab as HTMLElement).click();
                                }
                              }}
                              className="magical-glow hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
                            >
                              <Trophy className="mr-2 h-4 w-4" />
                              View Quests for This Act
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="quests" className="flex-1 m-4" data-section="quests">
              <Card className="h-full p-6 bg-background/20 border-border/30 gaming-glow backdrop-blur-sm">
                {currentActIndex >= 0 ? (
                  <>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-card-foreground flex items-center mb-2">
                        <Trophy className="mr-2 h-6 w-6 text-accent" />
                        Quests for {currentAct.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <Star className="mr-1 h-4 w-4" />
                          {currentQuests.length} Quests
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          Act {currentActIndex + 1} of {campaign.acts.length}
                        </div>
                      </div>
                      
                      {/* DM Quest Guidance */}
                      <div className="bg-gradient-to-r from-accent/10 to-primary/10 backdrop-blur-sm p-4 rounded-lg border border-accent/30 mb-4">
                        <div className="flex items-center mb-2">
                          <Crown className="mr-2 h-5 w-5 text-accent" />
                          <span className="font-semibold text-foreground">DM Quick Start</span>
                        </div>
                        <div className="text-sm text-foreground/80 space-y-1">
                          <p>• Start with Quest 1 and work through them sequentially</p>
                          <p>• Each quest includes NPCs, locations, and objectives</p>
                          <p>• Estimated time per quest: 1-3 hours of gameplay</p>
                          <p>• Complete all quests in this act before moving to the next</p>
                        </div>
                      </div>
                    </div>
                
                <ScrollArea className="h-full pr-4">
                  {currentQuests.length === 0 ? (
                    <div className="text-center py-8">
                      <Scroll className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No quests available for this act.</p>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="space-y-4">
                      {currentQuests.map((quest, index) => (
                        <AccordionItem key={index} value={`quest-${index}`} className="quest-card rounded-lg px-4 border border-border">
                          <AccordionTrigger className="hover:no-underline hover:bg-muted rounded px-3 py-4 text-card-foreground">
                            <div className="flex items-center gap-4 text-left w-full">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-card-foreground truncate">{quest.name}</div>
                                <div className="text-sm text-muted-foreground truncate">{quest.description}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-accent text-accent-foreground border-accent gaming-glow">
                                  {quest.type}
                                </Badge>
                                {quest.difficulty && (
                                  <Badge variant="outline" className="text-xs">
                                    {quest.difficulty}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-3 px-3 pb-4">
                              {/* Quest Description */}
                              <div className="bg-gradient-to-r from-accent/5 to-primary/5 p-3 rounded-lg border border-accent/20">
                                <p className="text-sm text-card-foreground leading-relaxed">{quest.description}</p>
                              </div>
                              
                              {/* Quest Objectives */}
                              {quest.objectives && quest.objectives.length > 0 && (
                                <div className="bg-background/50 p-4 rounded-lg border border-border">
                                  <div className="flex items-center mb-3">
                                    <Target className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    <h5 className="font-semibold text-orange-600 dark:text-orange-400">Objectives</h5>
                                  </div>
                                  <ol className="space-y-2">
                                    {quest.objectives.map((obj, i) => (
                                      <li key={i} className="text-sm text-card-foreground flex items-start">
                                        <Crosshair className="mr-2 h-3 w-3 mt-0.5 text-orange-500 flex-shrink-0" />
                                        {obj}
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {quest.npcs && quest.npcs.length > 0 && (
                                <div className="bg-gradient-to-r from-accent/10 to-primary/10 p-6 rounded-lg border border-accent/30 story-border">
                                  <h5 className="font-semibold text-lg mb-4 text-card-foreground flex items-center">
                                    <Heart className="mr-2 h-5 w-5 text-accent" />
                                    Key NPCs
                                    <Badge className="ml-2 bg-accent text-accent-foreground">{quest.npcs.length}</Badge>
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {quest.npcs.map((npc, i) => (
                                      <div key={i} className="bg-background/50 p-4 rounded-lg border border-border/50">
                                        <NPCImageGenerator
                                          npcName={npc}
                                          npcDescription={`NPC mentioned in ${quest.name} quest`}
                                          questContext={`Quest: ${quest.name} | Type: ${quest.type} | Description: ${quest.description}`}
                                          className=""
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {quest.locations && quest.locations.length > 0 && (
                                <div className="bg-muted p-3 rounded-lg border border-border">
                                  <h5 className="font-semibold text-sm mb-2 text-card-foreground">Locations:</h5>
                                  <ul className="text-sm space-y-1 text-card-foreground">
                                    {quest.locations.map((loc, i) => (
                                      <li key={i} className="flex items-start space-x-2">
                                        <span className="text-muted-foreground mt-1">•</span>
                                        <span>{loc}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {quest.rewards && (
                                <div className="bg-muted p-3 rounded-lg border border-border">
                                  <h5 className="font-semibold text-sm mb-2 text-card-foreground">Rewards:</h5>
                                  <p className="text-sm text-card-foreground">{quest.rewards}</p>
                                </div>
                              )}

                              {quest.prerequisites && (
                                <div className="bg-muted p-3 rounded-lg border border-border">
                                  <h5 className="font-semibold text-sm mb-2 text-card-foreground">Prerequisites:</h5>
                                  <p className="text-sm text-card-foreground">{quest.prerequisites}</p>
                                </div>
                              )}

                              {quest.outcomes && (
                                <div className="bg-muted p-3 rounded-lg border border-border">
                                  <h5 className="font-semibold text-sm mb-2 text-card-foreground">Expected Outcomes:</h5>
                                  <p className="text-sm text-card-foreground">{quest.outcomes}</p>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                {quest.difficulty && (
                                  <span>Difficulty: <strong className="text-card-foreground">{quest.difficulty}</strong></span>
                                )}
                                {quest.estimated_time && (
                                  <span>Sessions: <strong className="text-card-foreground">{quest.estimated_time}</strong></span>
                                )}
                </div>
          </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </ScrollArea>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Select an Act First</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose an act from the sidebar to view its quests
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <p>• Select an act to see available quests</p>
                      <p>• Each quest includes NPCs, locations, and objectives</p>
                      <p>• Generate character portraits for NPCs</p>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Game;
