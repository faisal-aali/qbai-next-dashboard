import { Drill } from "@/app/lib/models";
import { EmbeddingObject } from "../../lib/interfaces/drill";
import { cosineSimilarity } from "./utils";
import { IDrill } from "@/app/lib/interfaces/drill";

interface VectorSearchQuery {
    videoEmbedding: { $exists: boolean };
    categoryId?: string;
}

interface DrillWithScore extends IDrill {
    score: number;
    similarity: number;
    recencyScore: number;
    finalScore: number;
}

interface CacheEntry {
    data: IDrill[];
    timestamp: number;
}

const queryCache: { [key: string]: CacheEntry } = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Constants for scoring
const MIN_SIMILARITY_THRESHOLD = 0.3; // Minimum similarity score to consider
const RECENCY_WEIGHT = 0.2; // Weight for recency in final score
const SIMILARITY_WEIGHT = 0.8; // Weight for similarity in final score
const CATEGORY_BOOST = 1.2; // Boost factor for matching category

function getCacheKey(categoryId: string | null): string {
    return `drills-${categoryId || 'all'}`;
}

function calculateRecencyScore(creationDate: Date): number {
    const now = new Date();
    const ageInDays = (now.getTime() - new Date(creationDate).getTime()) / (1000 * 60 * 60 * 24);
    return Math.exp(-ageInDays / 365); // Exponential decay over a year
}

function normalizeScores(scores: number[]): number[] {
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    if (max === min) return scores.map(() => 1);
    return scores.map(score => (score - min) / (max - min));
}

export async function performVectorSearch(
    videoEmbedding: number[],
    categoryId: string | null,
    skip: number,
    limit: number
) {
    try {
        console.log('\n=== VECTOR SEARCH PROCESS ===');
        console.log('Input embedding length:', videoEmbedding.length);
        console.log('Category filter:', categoryId || 'All Categories');
        console.log('Pagination:', { skip, limit });

        // First, get all drills with embeddings
        const query: VectorSearchQuery = {
            videoEmbedding: { $exists: true }
        };
        
        if (categoryId && categoryId !== 'all') {
            query.categoryId = categoryId;
        }

        // Check cache for query results
        const cacheKey = getCacheKey(categoryId);
        const cachedQuery = queryCache[cacheKey];
        const now = Date.now();

        let drills;
        if (cachedQuery && (now - cachedQuery.timestamp) < CACHE_DURATION) {
            console.log('Cache hit: Using cached drills');
            drills = cachedQuery.data;
        } else {
            console.log('Cache miss: Fetching drills from database');
            drills = await Drill.find(query, {
                title: 1,
                description: 1,
                videoLink: 1,
                categoryId: 1,
                thumbnailUrl: 1,
                isFree: 1,
                userId: 1,
                creationDate: 1,
                videoEmbedding: 1
            }).lean();

            // Cache the query results
            queryCache[cacheKey] = {
                data: drills,
                timestamp: now
            };
            console.log('Cached', drills.length, 'drills');
        }

        console.log('Total drills found:', drills.length);

        // Calculate similarity scores and prepare for hybrid scoring
        const drillsWithScores = drills.map((drill: IDrill): DrillWithScore => {
            let drillEmbedding: number[] | null = null;
            if (drill.videoEmbedding) {
                if (Array.isArray(drill.videoEmbedding)) {
                    if (typeof drill.videoEmbedding[0] === 'number') {
                        drillEmbedding = drill.videoEmbedding;
                    } else if (drill.videoEmbedding[0] && 'embedding' in drill.videoEmbedding[0]) {
                        drillEmbedding = (drill.videoEmbedding[0] as EmbeddingObject).embedding;
                    }
                }
            }

            if (!drillEmbedding) {
                return { ...drill, score: 0, similarity: 0, recencyScore: 0, finalScore: 0 };
            }

            const similarity = cosineSimilarity(videoEmbedding, drillEmbedding);
            const recencyScore = calculateRecencyScore(drill.creationDate);
            
            // Apply category boost if category matches
            const categoryBoost = (categoryId && drill.categoryId === categoryId) ? CATEGORY_BOOST : 1;
            
            // Calculate final score using weighted combination
            const finalScore = (
                (similarity * SIMILARITY_WEIGHT + recencyScore * RECENCY_WEIGHT) * 
                categoryBoost
            );

            return { 
                ...drill, 
                score: similarity,
                similarity,
                recencyScore,
                finalScore
            };
        });

        // Filter out low similarity results and sort by final score
        const sortedDrills = drillsWithScores
            .filter((d: DrillWithScore) => d.similarity >= MIN_SIMILARITY_THRESHOLD)
            .sort((a: DrillWithScore, b: DrillWithScore) => b.finalScore - a.finalScore);

        console.log('Drills with valid embeddings:', sortedDrills.length);
        console.log('Minimum similarity threshold:', MIN_SIMILARITY_THRESHOLD);

        if (sortedDrills.length > 0) {
            const paginatedDrills = sortedDrills.slice(skip, skip + limit);
            console.log('Returning', paginatedDrills.length, 'drills after pagination');
            
            // Log score distribution
            const scores = paginatedDrills.map(d => d.finalScore);
            console.log('Score distribution:', {
                min: Math.min(...scores).toFixed(4),
                max: Math.max(...scores).toFixed(4),
                avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(4)
            });

            return {
                drills: paginatedDrills,
                total: sortedDrills.length
            };
        }

        console.log('No matching drills found');
        return null;
    } catch (error) {
        console.error('Error in vector search:', error);
        return null;
    }
} 
