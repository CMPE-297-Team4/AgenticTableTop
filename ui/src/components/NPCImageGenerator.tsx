import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { generateNPCImage } from '@/services/campaignApi';
import { NPCImageCache } from '@/utils/npcImageCache';
import { toast } from 'sonner';

interface NPCImageGeneratorProps {
  npcName: string;
  npcDescription: string;
  questContext?: string;
  campaignId?: string;  // Optional campaign ID for database lookup
  className?: string;
}

interface GeneratedImage {
  image_base64: string;
  prompt_used: string;
}

export const NPCImageGenerator: React.FC<NPCImageGeneratorProps> = ({
  npcName,
  npcDescription,
  questContext,
  campaignId,
  className = '',
}) => {
  const [loading, setLoading] = useState(true); // Start with loading true
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Automatically load or generate image on component mount
  useEffect(() => {
    const loadOrGenerateImage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, check local cache for instant display
        const cached = NPCImageCache.getCachedImage(npcName);
        if (cached) {
          setGeneratedImage({
            image_base64: cached.image_base64,
            prompt_used: cached.prompt_used
          });
          setLoading(false);
          // Still check backend in case there's a newer version
          // (but don't block UI)
        }
        
        // Call generateNPCImage - backend will:
        // 1. Check database first
        // 2. Return existing image if found
        // 3. Generate new image if not found
        // 4. Save to database
        const result = await generateNPCImage(npcName, npcDescription, questContext, campaignId);
        setGeneratedImage(result);
        NPCImageCache.saveToCache(npcName, result);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load or generate image';
        setError(errorMessage);
        console.error(`Error loading/generating image for ${npcName}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadOrGenerateImage();
  }, [npcName, npcDescription, questContext, campaignId]);

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    // Clear cache when regenerating
    NPCImageCache.clearCache(npcName);
    
    try {
      const result = await generateNPCImage(npcName, npcDescription, questContext, campaignId);
      setGeneratedImage(result);
      NPCImageCache.saveToCache(npcName, result);
      toast.success(`Portrait regenerated for ${npcName}!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate image';
      setError(errorMessage);
      toast.error(`Failed to regenerate portrait: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    NPCImageCache.clearCache(npcName);
    setGeneratedImage(null);
    setError(null);
    toast.success(`Cache cleared for ${npcName}`);
  };

  return (
    <div className={`npc-portrait-container ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Image className="h-4 w-4 text-accent" />
          <span className="font-medium text-foreground">{npcName}</span>
          {loading && (
            <Loader2 className="h-3 w-3 animate-spin text-accent ml-2" />
          )}
        </div>
      </div>

      {/* Action buttons row */}
      {generatedImage && !loading && (
        <div className="flex flex-wrap gap-2 mb-3">
          <Button
            onClick={handleRegenerate}
            size="sm"
            variant="outline"
            className="border-border/50 text-foreground hover:bg-accent/20 hover:text-accent-foreground gaming-glow text-xs px-2 py-1 h-7"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Regenerate
          </Button>
          <Button
            onClick={() => setShowPrompt(!showPrompt)}
            size="sm"
            variant="outline"
            className="border-border/50 text-foreground hover:bg-accent/20 hover:text-accent-foreground gaming-glow text-xs px-2 py-1 h-7"
          >
            <Eye className="mr-1 h-3 w-3" />
            {showPrompt ? 'Hide' : 'Show'} Prompt
          </Button>
          <Button
            onClick={handleClearCache}
            size="sm"
            variant="outline"
            className="border-red-500/50 text-red-500 hover:bg-red-500/20 hover:text-red-600 gaming-glow text-xs px-2 py-1 h-7"
          >
            <AlertCircle className="mr-1 h-3 w-3" />
            Clear Cache
          </Button>
        </div>
      )}

      {loading && !generatedImage && (
        <Card className="p-4 bg-background/20 border-border/30 gaming-glow backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span className="text-sm text-foreground">Loading portrait...</span>
          </div>
          <p className="text-xs text-foreground/70 mt-2 text-center">
            Checking database or generating if needed
          </p>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/30 gaming-glow backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500 font-medium">Generation Failed</span>
          </div>
          <p className="text-xs text-red-400 mt-1">{error}</p>
        </Card>
      )}

      {generatedImage && (
        <div className="space-y-3">
          <Card className="p-4 bg-background/20 border-border/30 gaming-glow backdrop-blur-sm">
            <img
              src={`data:image/png;base64,${generatedImage.image_base64}`}
              alt={`Portrait of ${npcName}`}
              className="npc-portrait w-full h-auto rounded-lg shadow-lg"
            />
            {/* Cache status indicator */}
            <div className="mt-2 text-center">
              <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/50 px-2 py-1">
                <Image className="mr-1 h-3 w-3" />
                Portrait Ready
              </Badge>
            </div>
          </Card>
          
          {showPrompt && (
            <Card className="p-3 bg-background/20 border-border/30 gaming-glow backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  <Eye className="mr-1 h-3 w-3" />
                  Prompt Used
                </Badge>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {generatedImage.prompt_used}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
