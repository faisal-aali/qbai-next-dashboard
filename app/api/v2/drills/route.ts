import { NextRequest, NextResponse } from "next/server";
import { Drill, Subscription } from "@/app/lib/models";
import { validateError } from "@/app/lib/functions";
import { authOption } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken';
import { IUser } from "@/app/lib/interfaces/user";
import microserviceAPI from "@/app/lib/microservice";
import { handleVideoAccess, logPerformance, cleanupCaches, getEmbedding, searchResultCache } from "@/app/lib/search/utils";
import { performTextSearch } from "@/app/lib/search/textSearch";
import { performVectorSearch } from "@/app/lib/search/vectorSearch";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const totalStartTime = performance.now();
    try {
        // Clean up old cache entries
        cleanupCaches();
        
        // Session verification
        const authStartTime = performance.now();
        let session;
        const authHeader = headers().get("authorization");
        if (authHeader) {
            const user = jwt.verify(authHeader.split('Bearer ')[1], process.env.NEXTAUTH_SECRET as string) as Partial<IUser>;
            if (!user._id) throw Error('Malformed JWT');
            session = { user };
        } else {
            session = await getServerSession(authOption);
        }
        logPerformance('Authentication', authStartTime);

        if (!session || !session.user || !session.user.role) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        // Check subscription status
        const subscriptionStartTime = performance.now();
        const subscription = await Subscription.findOne({
            userId: session.user._id,
            currentPeriodEnd: { $gt: new Date() }
        }, {}, { sort: { creationDate: -1 } });
        logPerformance('Subscription Check', subscriptionStartTime);

        // Parse request parameters
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const search = searchParams.get('search') || '';
        const categoryId = searchParams.get('categoryId');
        const skip = (page - 1) * limit;

        // Build query
        const query: {
            categoryId?: string,
            $text?: { $search: string },
            $or?: Array<{ [key: string]: { $regex: string, $options: string } }>
        } = {};
        if (categoryId && categoryId !== 'all') query.categoryId = categoryId;
        if (search && search.trim()) query.$text = { $search: search };

        // Check cache for search results
        const cacheKey = `${search}`;  // Only use search query as cache key
        console.log('Checking embedding cache for query:', search);
        const cachedEmbedding = searchResultCache.get(cacheKey);
        console.log('Cached embedding data:', cachedEmbedding ? {
            exists: true,
            length: cachedEmbedding.length,
            firstFewValues: cachedEmbedding.slice(0, 5)
        } : { exists: false });
        let embedding;

        let result;
        let searchType = 'fallback';
        if (!search) {
            // If no search query, perform fallback search immediately
            const fallbackStartTime = performance.now();
            result = await performTextSearch(query, '', skip, limit);
            logPerformance('Fallback Search', fallbackStartTime);
        } else {
            // If there is a search query, try text search first
            const textSearchStartTime = performance.now();
            const textSearchResult = await performTextSearch(query, search, skip, limit);
            logPerformance('Text Search', textSearchStartTime);

            const threshold = 2;
            const exactMatches = textSearchResult.drills.filter(drill => (drill as any).score >= threshold);

            if (exactMatches.length > 0) {
                result = { drills: exactMatches, total: exactMatches.length };
                searchType = 'text';
            } else {
                // No exact matches, try vector search
                try {
                    const embeddingStartTime = performance.now();
                    // Use cached embedding if available
                    if (cachedEmbedding) {
                        console.log('Cache hit: Using cached embedding for query:', search);
                        embedding = cachedEmbedding;
                    } else {
                        console.log('Cache miss: Generating new embedding for query:', search);
                        embedding = await getEmbedding(search, microserviceAPI.textToEmbedding);
                        // Cache only the embedding
                        searchResultCache.set(cacheKey, embedding);
                        console.log('Cached new embedding:', {
                            length: embedding.length,
                            firstFewValues: embedding.slice(0, 5)
                        });
                    }
                    logPerformance('Embedding Generation', embeddingStartTime);

                    const vectorSearchStartTime = performance.now();
                    const vectorResult = await performVectorSearch(embedding, categoryId, skip, limit);
                    logPerformance('Vector Search', vectorSearchStartTime); 

                    if (vectorResult && vectorResult.drills.length > 0) {
                        // Print top 12 results
                        console.log('\nTop 12 Results:');
                        vectorResult.drills.slice(0, 12).forEach((drill, index) => {
                            const score = (drill as any).finalScore || (drill as any).score || 0;
                            console.log(`${index + 1}. ${drill.title} (${score.toFixed(4)})`);
                        });

                        result = vectorResult;
                        searchType = 'vector';
                    } else {
                        console.log('No vector search results, falling back to text search');

                        // If vector search returns no results, fall back to text search
                        const fallbackStartTime = performance.now();
                        result = await performTextSearch(query, '', skip, limit);
                        logPerformance('Fallback Search After Vector', fallbackStartTime);
                    }
                } catch (err) {
                    console.error("Error in vector search:", err);
                    // If vector search fails, fall back to text search
                    const fallbackStartTime = performance.now();
                    result = await performTextSearch(query, '', skip, limit);
                    logPerformance('Fallback Search After Error', fallbackStartTime);
                }
            }
        }

        const processStartTime = performance.now();
        const processedDrills = handleVideoAccess(result.drills, session, subscription);
        logPerformance('Video Access Processing', processStartTime);
        
        const response = {
            drills: processedDrills,
            pagination: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit)
            },
            searchType
        };
        
        logPerformance('Total Request Processing', totalStartTime);
        return NextResponse.json(response);
    } catch (err) {
        console.error("Unhandled error:", err);
        const obj = validateError(err);
        logPerformance('Error Handling', totalStartTime);
        return NextResponse.json({
            status: 'error',
            message: obj.message
        }, { status: obj.status });
    }
}


