/**
 * NPC Image Cache Utility
 * 
 * Provides functions to manage NPC image caching in localStorage
 */

interface CachedImage {
  image_base64: string;
  prompt_used: string;
  timestamp: number;
  npcName: string;
}

export class NPCImageCache {
  private static readonly CACHE_PREFIX = 'npc_image_';
  private static readonly CACHE_EXPIRY_DAYS = 7;

  /**
   * Generate cache key for an NPC
   */
  private static getCacheKey(npcName: string): string {
    return `${this.CACHE_PREFIX}${npcName.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * Check if cache entry is expired
   */
  private static isExpired(timestamp: number): boolean {
    const expiryTime = Date.now() - (this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    return timestamp < expiryTime;
  }

  /**
   * Get cached image for an NPC
   */
  static getCachedImage(npcName: string): CachedImage | null {
    const cacheKey = this.getCacheKey(npcName);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;

    try {
      const cachedImage: CachedImage = JSON.parse(cached);
      
      if (this.isExpired(cachedImage.timestamp)) {
        this.clearCache(npcName);
        return null;
      }
      
      return cachedImage;
    } catch (error) {
      console.warn('Failed to parse cached image:', error);
      this.clearCache(npcName);
      return null;
    }
  }

  /**
   * Save image to cache
   */
  static saveToCache(npcName: string, imageData: { image_base64: string; prompt_used: string }): void {
    const cacheKey = this.getCacheKey(npcName);
    const cacheData: CachedImage = {
      ...imageData,
      timestamp: Date.now(),
      npcName: npcName
    };
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save image to cache:', error);
    }
  }

  /**
   * Clear cache for a specific NPC
   */
  static clearCache(npcName: string): void {
    const cacheKey = this.getCacheKey(npcName);
    localStorage.removeItem(cacheKey);
  }

  /**
   * Clear all NPC image cache
   */
  static clearAllCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { totalCached: number; totalSize: number } {
    const keys = Object.keys(localStorage);
    const npcKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
    
    let totalSize = 0;
    npcKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    });

    return {
      totalCached: npcKeys.length,
      totalSize: totalSize
    };
  }

  /**
   * Clean up expired cache entries
   */
  static cleanupExpiredCache(): number {
    const keys = Object.keys(localStorage);
    const npcKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
    let cleanedCount = 0;

    npcKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const cachedImage: CachedImage = JSON.parse(data);
          if (this.isExpired(cachedImage.timestamp)) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // Remove corrupted cache entries
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });

    return cleanedCount;
  }
}


