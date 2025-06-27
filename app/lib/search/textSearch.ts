import { Drill } from "@/app/lib/models";

export async function performTextSearch(
    query: any,
    search: string,
    skip: number,
    limit: number
) {
    const projection = {
        title: 1 as const,
        description: 1 as const,
        videoLink: 1 as const,
        categoryId: 1 as const,
        thumbnailUrl: 1 as const,
        isFree: 1 as const,
        locked: 1 as const,
        userId: 1 as const,
        creationDate: 1 as const,
        ...(search && search.trim() ? { score: { $meta: "textScore" } } : {})
    };

    const [drills, total] = await Promise.all([
        Drill.find(query, projection)
            .sort(search && search.trim() ? { score: { $meta: "textScore" } } : { creationDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Drill.countDocuments(query)
    ]);

    return {
        drills,
        total
    };
} 