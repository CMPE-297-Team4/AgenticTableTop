/**
 * Monster Image Cache Utility
 * 
 * Provides functions to manage Monster image caching in localStorage
 */

interface CachedImage {
  image_base64: string;
  prompt_used: string;
  timestamp: number;
  monsterName: string;
}

export class MonsterImageCache {
  private static readonly CACHE_PREFIX = 'monster_image_';
  private static readonly CACHE_EXPIRY_DAYS = 7;

  /**
   * Generate cache key for a monster
   */
  private static getCacheKey(monsterName: string): string {
    return `${this.CACHE_PREFIX}${monsterName.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * Check if cache entry is expired
   */
  private static isExpired(timestamp: number): boolean {
    const expiryTime = Date.now() - (this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    return timestamp < expiryTime;
  }

  /**
   * Get cached image for a monster
   */
  static getCachedImage(monsterName: string): CachedImage | null {
    const cacheKey = this.getCacheKey(monsterName);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;

    try {
      const cachedImage: CachedImage = JSON.parse(cached);
      
      if (this.isExpired(cachedImage.timestamp)) {
        this.clearCache(monsterName);
        return null;
      }
      
      return cachedImage;
    } catch (error) {
      console.warn('Failed to parse cached monster image:', error);
      this.clearCache(monsterName);
      return null;
    }
  }

  /**
   * Save image to cache
   */
  static saveToCache(monsterName: string, imageData: { image_base64: string; prompt_used: string }): void {
    const cacheKey = this.getCacheKey(monsterName);
    const cacheData: CachedImage = {
      ...imageData,
      timestamp: Date.now(),
      monsterName: monsterName
    };
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save monster image to cache:', error);
    }
  }

  /**
   * Clear cache for a specific monster
   */
  static clearCache(monsterName: string): void {
    const cacheKey = this.getCacheKey(monsterName);
    localStorage.removeItem(cacheKey);
  }

  /**
   * Clear all monster image cache
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
    const monsterKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
    
    let totalSize = 0;
    monsterKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    });

    return {
      totalCached: monsterKeys.length,
      totalSize: totalSize
    };
  }

  /**
   * Clean up expired cache entries
   */
  static cleanupExpiredCache(): number {
    const keys = Object.keys(localStorage);
    const monsterKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
    let cleanedCount = 0;

    monsterKeys.forEach(key => {
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

