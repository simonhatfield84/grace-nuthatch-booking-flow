import { addMinutes } from "date-fns";
import { OptimizedAvailabilityService } from "./optimizedAvailabilityService";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface AvailabilityData {
  tableId: number;
  date: string;
  timeSlots: Array<{
    time: string;
    available: boolean;
    maxDuration: number;
  }>;
}

export class AvailabilityCacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (increased from 2)
  private static readonly MAX_CACHE_SIZE = 200; // Increased cache size

  /**
   * Generate cache key for availability data
   */
  private static getCacheKey(tableId: number, date: string, partySize: number): string {
    return `availability_${tableId}_${date}_${partySize}`;
  }

  /**
   * Get cached availability data
   */
  static getCachedAvailability(tableId: number, date: string, partySize: number): AvailabilityData | null {
    const key = this.getCacheKey(tableId, date, partySize);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Cache availability data
   */
  static cacheAvailability(tableId: number, date: string, partySize: number, data: AvailabilityData): void {
    const key = this.getCacheKey(tableId, date, partySize);
    
    // Enforce cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      for (let i = 0; i < 20; i++) { // Remove 20 oldest entries
        if (sortedEntries[i]) {
          this.cache.delete(sortedEntries[i][0]);
        }
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    });
  }

  /**
   * Invalidate cache for specific table and date
   */
  static invalidateTable(tableId: number, date: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache.entries()) {
      if (key.includes(`availability_${tableId}_${date}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Also clear optimized service cache when invalidating
    OptimizedAvailabilityService.clearCache();
  }

  /**
   * Invalidate all cache entries
   */
  static clearCache(): void {
    this.cache.clear();
    OptimizedAvailabilityService.clearCache();
  }

  /**
   * Prefetch availability data for adjacent time slots
   */
  static async prefetchAdjacentSlots(
    tableId: number,
    currentTime: string,
    date: string,
    partySize: number,
    fetchFunction: (tableId: number, time: string, date: string, partySize: number) => Promise<any>
  ): Promise<void> {
    try {
      // Generate adjacent time slots (±2 hours)
      const [hours, minutes] = currentTime.split(':').map(Number);
      const currentDateTime = new Date();
      currentDateTime.setHours(hours, minutes, 0, 0);

      const timesToPrefetch: string[] = [];
      
      // Previous slots (30 min intervals)
      for (let i = 1; i <= 4; i++) {
        const prevTime = addMinutes(currentDateTime, -30 * i);
        if (prevTime.getHours() >= 10) { // Assume venue opens at 10 AM
          timesToPrefetch.push(
            `${prevTime.getHours().toString().padStart(2, '0')}:${prevTime.getMinutes().toString().padStart(2, '0')}`
          );
        }
      }

      // Next slots (30 min intervals)
      for (let i = 1; i <= 4; i++) {
        const nextTime = addMinutes(currentDateTime, 30 * i);
        if (nextTime.getHours() <= 22) { // Assume venue closes at 10 PM
          timesToPrefetch.push(
            `${nextTime.getHours().toString().padStart(2, '0')}:${nextTime.getMinutes().toString().padStart(2, '0')}`
          );
        }
      }

      // Prefetch in background
      const prefetchPromises = timesToPrefetch.map(async (time) => {
        const cacheKey = this.getCacheKey(tableId, date, partySize);
        if (!this.cache.has(cacheKey)) {
          try {
            const data = await fetchFunction(tableId, time, date, partySize);
            // Cache with shorter expiration for prefetched data
            this.cache.set(cacheKey, {
              data,
              timestamp: Date.now(),
              expiresAt: Date.now() + (this.CACHE_DURATION / 2)
            });
          } catch (error) {
            console.warn(`Failed to prefetch data for ${time}:`, error);
          }
        }
      });

      // Don't await - let prefetch happen in background
      Promise.allSettled(prefetchPromises);
      
    } catch (error) {
      console.warn('Error during prefetch:', error);
    }
  }

  /**
   * Smart debouncing for frequent operations
   */
  private static debounceTimers = new Map<string, NodeJS.Timeout>();

  static smartDebounce<T extends any[]>(
    key: string,
    fn: (...args: T) => Promise<any>,
    delay: number = 300
  ): (...args: T) => Promise<any> {
    return (...args: T) => {
      return new Promise((resolve, reject) => {
        // Clear existing timer
        const existingTimer = this.debounceTimers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.debounceTimers.delete(key);
          }
        }, delay);

        this.debounceTimers.set(key, timer);
      });
    };
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    hitRatio: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      size: this.cache.size,
      hitRatio: 0, // Would need hit/miss tracking for accurate ratio
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  /**
   * Cleanup expired cache entries
   */
  static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Auto-cleanup every 5 minutes
setInterval(() => {
  AvailabilityCacheService.cleanup();
}, 5 * 60 * 1000);
