import { Drill } from "@/app/lib/models";
import { IDrill } from "@/app/lib/interfaces/drill";
import { Session } from "next-auth";
import { ISubscription } from "@/app/lib/interfaces/subscription";
import { IUser } from "@/app/lib/interfaces/user";

// Cache configuration
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

// Generic cache class
class Cache<T> {
    private cache: Map<string, { data: T; timestamp: number }>;
    private ttl: number;

    constructor(ttl: number = CACHE_TTL) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    get(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    set(key: string, data: T): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    cleanup(): void {
        const now = Date.now();
        Array.from(this.cache.entries()).forEach(([key, value]) => {
            if (now - value.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        });
    }
}

// Create cache instances
export const embeddingCache = new Cache<number[]>();
export const searchResultCache = new Cache<any>();

// Cache cleanup helper
export const cleanupCaches = () => {
    embeddingCache.cleanup();
    searchResultCache.cleanup();
};

// Get cached embedding or generate new one
export const getEmbedding = async (text: string, generateEmbedding: (text: string) => Promise<number[]>): Promise<number[]> => {
    const cacheKey = text.toLowerCase().trim();
    const cached = embeddingCache.get(cacheKey);
    
    if (cached) {
        console.log('Using cached embedding for:', text);
        return cached;
    }

    const embedding = await generateEmbedding(text);
    embeddingCache.set(cacheKey, embedding);
    return embedding;
};

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const startTime = performance.now();
    
    if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
        return 0;
    }
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    const result = Math.max(-1, Math.min(1, dotProduct / (magnitudeA * magnitudeB)));
    return result;
}



export function handleVideoAccess(
    drills: IDrill[],
    session: Session | { user: Partial<IUser> },
    subscription: ISubscription | null
) {
    return drills.map(drill => {
        if (!drill.isFree && session.user?.role && ['player', 'trainer'].includes(session.user.role) && !subscription) {
            drill.videoLink = '';
        }
        return drill;
    });
}

export function logPerformance(operation: string, startTime: number): number {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`⏱️ Performance [${operation}]: ${duration.toFixed(2)}ms`);
    return endTime;
} 