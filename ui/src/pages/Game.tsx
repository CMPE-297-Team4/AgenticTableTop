import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, MapPin, Users, Clock, Star, Target, AlertTriangle, CheckCircle, Sword, Shield, Scroll, BookOpen, Compass, Crown, Gem, Flame, Zap, Eye, Heart, Skull, Crosshair, Trophy, Key, Lock } from "lucide-react";
import type { Campaign } from "@/services/campaignApi";
import monsterImage from "@/assets/dnd-monster.png";

const Game = () => {
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [currentActIndex, setCurrentActIndex] = useState(0);

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
  }, [navigate]);

  const handleBack = () => {
    navigate("/");
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
      <header className="bg-background/20 border-b-2 border-border/30 p-4 flex justify-between items-center shadow-lg gaming-glow relative z-10 backdrop-blur-sm">
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
        <Button variant="outline" size="sm" onClick={handleBack} className="border-border/50 text-foreground hover:bg-accent/20 hover:text-accent-foreground gaming-glow relative z-10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Generator
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Panel - Act Navigation & Image */}
        <aside className="w-80 bg-background/20 border-r-2 border-border/30 flex flex-col backdrop-blur-sm">
          <div className="h-48 bg-accent border-b-2 border-border flex items-center justify-center overflow-hidden">
            <img src={monsterImage} alt="D&D Campaign" className="w-full h-full object-cover" />
          </div>
          
          <div className="p-4 bg-background/20 border-b-2 border-border/30 gaming-glow backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center">
              <Compass className="mr-2 h-5 w-5" />
              Campaign Acts
            </h2>
            <div className="space-y-3">
              {campaign.acts.map((act, index) => (
                <div
                  key={index}
                  className={`relative transition-all duration-300 cursor-pointer ${
                    currentActIndex === index 
                      ? 'act-highlight' 
                      : 'hover:bg-accent/20'
                  }`}
                  onClick={() => setCurrentActIndex(index)}
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      currentActIndex === index 
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-card text-card-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">
                        Act {index + 1}
                      </div>
                      <div className="text-xs text-foreground/70 truncate">
                        {act.title}
                      </div>
                    </div>
                    {currentActIndex === index && (
                      <Crown className="h-4 w-4 text-accent" />
                    )}
                  </div>
                  {currentActIndex === index && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-primary rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-foreground/80 mb-1">
                <span>Progress</span>
                <span>{currentActIndex + 1} / {campaign.acts.length}</span>
              </div>
              <Progress 
                value={((currentActIndex + 1) / campaign.acts.length) * 100} 
                className="h-2 bg-background/20 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-4 bg-background/20 backdrop-blur-sm">
            <h3 className="font-semibold mb-4 text-foreground flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Current Act Details
            </h3>
            <div className="space-y-4">
              {/* Act Title & Summary */}
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 p-4 rounded-lg border border-accent/20">
                <h4 className="font-bold text-lg text-card-foreground mb-2">{currentAct.title}</h4>
                <p className="text-sm text-card-foreground italic leading-relaxed">{currentAct.summary}</p>
              </div>

              {/* Act Goals & Stakes */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-background/50 p-3 rounded border border-border">
                  <div className="flex items-center mb-2">
                    <Target className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="font-semibold text-orange-600 dark:text-orange-400 block">Goal</span>
                  </div>
                  <p className="text-sm text-card-foreground leading-relaxed">{currentAct.goal}</p>
                </div>
                
                <div className="bg-background/50 p-3 rounded border border-border">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="font-semibold text-red-600 dark:text-red-400 block">Stakes</span>
                  </div>
                  <p className="text-sm text-card-foreground leading-relaxed">{currentAct.stakes}</p>
                </div>
              </div>
              {/* Locations */}
              {currentAct.locations && currentAct.locations.length > 0 && (
                <div className="bg-background/50 p-3 rounded border border-border">
                  <div className="flex items-center mb-2">
                    <MapPin className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-600 dark:text-green-400 block">Key Locations</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {currentAct.locations.map((location, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Act Details */}
              {(currentAct.primary_conflict || currentAct.mechanics || currentAct.handoff_notes) && (
                <div className="space-y-3">
                  {currentAct.primary_conflict && (
                    <div className="bg-background/50 p-3 rounded border border-border">
                      <div className="flex items-center mb-2">
                        <Sword className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold text-purple-600 dark:text-purple-400 block">Primary Conflict</span>
                      </div>
                      <p className="text-sm text-card-foreground leading-relaxed">{currentAct.primary_conflict}</p>
                    </div>
                  )}
                  
                  {currentAct.mechanics && currentAct.mechanics.length > 0 && (
                    <div className="bg-background/50 p-3 rounded border border-border">
                      <div className="flex items-center mb-2">
                        <Zap className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-blue-600 dark:text-blue-400 block">Mechanics & Features</span>
                      </div>
                      <div className="space-y-1">
                        {currentAct.mechanics.map((mechanic, index) => (
                          <div key={index} className="text-sm text-card-foreground flex items-start">
                            <Gem className="mr-2 h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                            {mechanic}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {currentAct.handoff_notes && currentAct.handoff_notes.length > 0 && (
                    <div className="bg-background/50 p-3 rounded border border-border">
                      <div className="flex items-center mb-2">
                        <Scroll className="mr-2 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400 block">Handoff Notes</span>
                      </div>
                      <div className="space-y-1">
                        {currentAct.handoff_notes.map((note, index) => (
                          <div key={index} className="text-sm text-card-foreground flex items-start">
                            <Key className="mr-2 h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {currentAct.entry_condition && (
                <div>
                  <Badge variant="outline" className="mb-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">Entry Requirements</Badge>
                  <p className="text-sm text-card-foreground">{currentAct.entry_condition}</p>
                </div>
              )}
              {currentAct.exit_condition && (
                <div>
                  <Badge variant="outline" className="mb-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700">Exit Conditions</Badge>
                  <p className="text-sm text-card-foreground">{currentAct.exit_condition}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Right Panel - Campaign Content */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="story" className="flex-1 flex flex-col">
            <TabsList className="m-4 mb-0 bg-background/20 border-border/30 gaming-glow backdrop-blur-sm">
              <TabsTrigger value="story" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-card-foreground transition-all duration-300 hover:shadow-lg">Campaign Story</TabsTrigger>
              <TabsTrigger value="quests" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-card-foreground transition-all duration-300 hover:shadow-lg">Quests ({currentQuests.length})</TabsTrigger>
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

                    {/* Acts Overview Section */}
                    <div className="border-t border-border pt-6">
                      <h3 className="text-xl font-bold mb-4 text-card-foreground">Campaign Acts</h3>
                      <div className="space-y-4">
                        {campaign.acts.map((act, index) => (
                          <div 
                            key={index} 
                            className={`p-5 rounded-lg border-2 shadow-sm transition-all duration-300 ${
                              currentActIndex === index 
                                ? 'act-highlight' 
                                : 'border-border bg-card hover:border-accent/50 hover:shadow-lg'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-lg font-semibold text-card-foreground">
                                Act {index + 1}: {act.title}
                              </h4>
                              {currentActIndex === index && (
                                <Badge className="ml-2 bg-accent text-accent-foreground">Current</Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3 italic">{act.summary}</p>
                            
                            <div className="space-y-3 bg-muted p-4 rounded-lg border border-border">
                              <div>
                                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase block mb-1">Goal:</span>
                                <p className="text-sm text-card-foreground leading-relaxed">{act.goal}</p>
                              </div>
                              
                              <div>
                                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase block mb-1">Stakes:</span>
                                <p className="text-sm text-card-foreground leading-relaxed">{act.stakes}</p>
                              </div>
                              
                              {act.primary_conflict && (
                                <div>
                                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase block mb-1">Primary Conflict:</span>
                                  <p className="text-sm text-card-foreground leading-relaxed">{act.primary_conflict}</p>
                                </div>
                              )}
                              
                              {act.locations && act.locations.length > 0 && (
                                <div>
                                  <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase block mb-1">Locations:</span>
                                  <p className="text-sm text-card-foreground leading-relaxed">
                                    {act.locations.join(', ')}
                                  </p>
                                </div>
                              )}
                              
                              {act.mechanics && act.mechanics.length > 0 && (
                                <div>
                                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase block mb-1">Mechanics:</span>
                                  <p className="text-sm text-card-foreground leading-relaxed">
                                    {act.mechanics.join(', ')}
                                  </p>
                                </div>
                              )}
                              
                              {act.entry_condition && (
                                <div>
                                  <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase block mb-1">Entry Requirements:</span>
                                  <p className="text-sm text-card-foreground leading-relaxed">{act.entry_condition}</p>
                                </div>
                              )}
                              
                              {act.exit_condition && (
                                <div>
                                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase block mb-1">Exit Conditions:</span>
                                  <p className="text-sm text-card-foreground leading-relaxed">{act.exit_condition}</p>
                                </div>
                              )}
                              
                              {act.handoff_notes && act.handoff_notes.length > 0 && (
                                <div>
                                  <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase block mb-1">Handoff Notes:</span>
                                  <ul className="text-sm text-card-foreground leading-relaxed list-disc list-inside">
                                    {act.handoff_notes.map((note, i) => (
                                      <li key={i}>{note}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground"
                              onClick={() => setCurrentActIndex(index)}
                            >
                              View Quests for Act {index + 1}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="quests" className="flex-1 m-4">
              <Card className="h-full p-6 bg-background/20 border-border/30 gaming-glow backdrop-blur-sm">
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
                                <div className="bg-muted p-3 rounded-lg border border-border">
                                  <h5 className="font-semibold text-sm mb-2 text-card-foreground">Key NPCs:</h5>
                                  <ul className="text-sm space-y-1 text-card-foreground">
                                    {quest.npcs.map((npc, i) => (
                                      <li key={i} className="flex items-start space-x-2">
                                        <span className="text-muted-foreground mt-1">•</span>
                                        <span>{npc}</span>
                                      </li>
                                    ))}
                                  </ul>
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
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Game;