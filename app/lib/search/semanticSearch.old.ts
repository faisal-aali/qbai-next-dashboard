import { Drill } from "@/app/lib/models";
import { EmbeddingObject } from "../../lib/interfaces/drill";
import { cosineSimilarity } from "./utils";

type SemanticQuery = {
    videoEmbedding: { $exists: boolean };
    categoryId?: string;
}

export async function performSemanticSearch(
    videoEmbedding: number[],
    categoryId: string | null,
    skip: number,
    limit: number
) {
    const semanticQuery: SemanticQuery = {
        videoEmbedding: { $exists: true }
    };
    if (categoryId && categoryId !== 'all') {
        semanticQuery.categoryId = categoryId;
    }

    const allDrills = await Drill.find(semanticQuery, {
        videoEmbedding: 1 as const,
        title: 1 as const,
        description: 1 as const,
        videoLink: 1 as const,
        categoryId: 1 as const,
        thumbnailUrl: 1 as const,
        isFree: 1 as const,
        locked: 1 as const,
        userId: 1 as const,
        creationDate: 1 as const
    })
    .limit(100)
    .lean();

    if (allDrills.length === 0) return null;

    const drillsWithSimilarity = allDrills.map(drill => {
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
            return { ...drill, similarity: 0 };
        }

        const similarity = cosineSimilarity(videoEmbedding, drillEmbedding);
        return { ...drill, similarity };
    });

    const filteredDrills = drillsWithSimilarity
        .filter(d => d.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity);

    if (filteredDrills.length === 0) return null;

    const paginatedDrills = filteredDrills.slice(skip, skip + limit);
    return {
        drills: paginatedDrills,
        total: filteredDrills.length
    };
} 