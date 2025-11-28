import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { generateMonsterImage, getMonsterImage } from '@/services/campaignApi';
import { MonsterImageCache } from '@/utils/monsterImageCache';
import { toast } from 'sonner';

interface MonsterImageGeneratorProps {
  monsterName: string;
  monsterType?: string;
  monsterDescription?: string;
  questContext?: string;
  campaignId?: string;  // Optional campaign ID for database lookup
  className?: string;
}

interface GeneratedImage {
  image_base64: string;
  prompt_used: string;
}

export const MonsterImageGenerator: React.FC<MonsterImageGeneratorProps> = ({
  monsterName,
  monsterType,
  monsterDescription,
  questContext,
  campaignId,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Load existing image from database or cache on component mount (but don't auto-generate)
  useEffect(() => {
    const loadExistingImage = async () => {
      // First, check local cache for instant display
      const cached = MonsterImageCache.getCachedImage(monsterName);
      if (cached) {
        setGeneratedImage({
          image_base64: cached.image_base64,
          prompt_used: cached.prompt_used
        });
      }
      
      // Then check database for stored image
      try {
        const dbImage = await getMonsterImage(monsterName, campaignId);
        if (dbImage) {
          setGeneratedImage({
            image_base64: dbImage.image_base64,
            prompt_used: dbImage.prompt_used
          });
          // Update cache with database image
          MonsterImageCache.saveToCache(monsterName, dbImage);
        }
      } catch (err) {
        // Image not found in database - that's okay, user can generate it
        // Only log if it's not a 404
        if (err instanceof Error && !err.message.includes('not found')) {
          console.error(`Error loading image from database for ${monsterName}:`, err);
        }
      }
    };

    loadExistingImage();
  }, [monsterName, campaignId]);

  const handleGenerateImage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call generateMonsterImage - backend will:
      // 1. Check database first
      // 2. Return existing image if found
      // 3. Generate new image if not found
      // 4. Save to database
      const result = await generateMonsterImage(
        monsterName,
        monsterType,
        monsterDescription,
        questContext,
        campaignId
      );
      setGeneratedImage(result);
      MonsterImageCache.saveToCache(monsterName, result);
      toast.success(`Portrait generated for ${monsterName}!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);
      toast.error(`Failed to generate portrait: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    // Clear cache when regenerating
    MonsterImageCache.clearCache(monsterName);
    
    try {
      const result = await generateMonsterImage(
        monsterName,
        monsterType,
        monsterDescription,
        questContext,
        campaignId
      );
      setGeneratedImage(result);
      MonsterImageCache.saveToCache(monsterName, result);
      toast.success(`Portrait regenerated for ${monsterName}!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate image';
      setError(errorMessage);
      toast.error(`Failed to regenerate portrait: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    MonsterImageCache.clearCache(monsterName);
    setGeneratedImage(null);
    setError(null);
    toast.success(`Cache cleared for ${monsterName}`);
  };

  return (
    <div className={`monster-portrait-container ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Image className="h-4 w-4 text-accent" />
          <span className="font-medium text-foreground">{monsterName}</span>
          {monsterType && (
            <Badge variant="outline" className="text-xs">
              {monsterType}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!generatedImage && !loading && (
            <Button
              onClick={handleGenerateImage}
              size="sm"
              className="magical-glow hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-xs px-3 py-1 h-7"
            >
              <Image className="mr-1 h-3 w-3" />
              Generate Portrait
            </Button>
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

      {loading && (
        <Card className="p-4 bg-background/20 border-border/30 gaming-glow backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span className="text-sm text-foreground">Generating portrait...</span>
          </div>
          <p className="text-xs text-foreground/70 mt-2 text-center">
            This may take 10-15 seconds
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
              alt={`Portrait of ${monsterName}`}
              className="monster-portrait w-full h-auto rounded-lg shadow-lg"
            />
            {/* Cache status indicator */}
            <div className="mt-2 text-center">
              <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/50 px-2 py-1">
                <Image className="mr-1 h-3 w-3" />
                Cached Portrait
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

