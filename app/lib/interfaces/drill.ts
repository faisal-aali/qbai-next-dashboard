export interface IDrillRecommendationCriteria {
    refId: string,
    value: number,
    op: 'above' | 'below'
}

export interface IDrill {
    _id: string,
    userId: string,
    categoryId: string,
    videoLink: string,
    title: string,
    description: string,
    isFree: boolean,
    creationDate: Date,
    thumbnailUrl?: string,
    videoTranscription: string | null,
    videoEmbedding: number[] | null,
    recommendationCriteria?: Array<IDrillRecommendationCriteria>
}

export interface EmbeddingObject {
    object: string;
    index: number;
    embedding: number[];
}

export interface SearchResult {
    drills: any[];
    total: number;
} 