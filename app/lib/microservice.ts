import axios from 'axios';

// Create axios instance with base configuration
const microserviceAxios = axios.create({
    baseURL: process.env.MICROSERVICE_API_BASE_URL || '',
    headers: {
        'x-api-key': process.env.MICROSERVICE_API_TOKEN || ''
    }
});

interface EmbeddingResponse {
    object: string;
    index: number;
    embedding: number[];
}

class MicroserviceAPI {
    public async getVimeoTranscription(vimeoId: string): Promise<{ transcriptionText: string | null, embedding: number[] | null }> {
        try {
            const response = await microserviceAxios.get(`/vimeo/texttracks/${vimeoId}`);
            const embedding = response.data.embedding;
            let processedEmbedding: number[] | null = null;

            // Extract the embedding array from the complex structure
            if (embedding) {
                try {
                    if (typeof embedding === 'string') {
                        const parsed = JSON.parse(embedding);
                        if (Array.isArray(parsed) && parsed[0]?.embedding) {
                            processedEmbedding = parsed[0].embedding;
                        }
                    } else if (Array.isArray(embedding)) {
                        if (embedding[0]?.embedding) {
                            processedEmbedding = embedding[0].embedding;
                        } else if (typeof embedding[0] === 'number') {
                            processedEmbedding = embedding;
                        }
                    }
                    console.log("Processed videoEmbedding:", processedEmbedding ? "Valid array" : "Invalid");
                } catch (error) {
                    console.error("Error processing embedding:", error);
                    processedEmbedding = null;
                }
            }

            return {
                transcriptionText: response.data.transcriptionText,
                embedding: processedEmbedding
            };
        } catch (error) {
            console.error('Error fetching video transcription:', error);
            throw new Error(`Failed to fetch video transcription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async textToEmbedding(text: string): Promise<number[]> {
        try {
            const response = await microserviceAxios.post<{ embedding: EmbeddingResponse[] }>('/text/embedding', {
                text: text
            });

            if (!response.data.embedding) {
                throw new Error('No embedding received from API');
            }

            const embedding = response.data.embedding[0]?.embedding;
            if (!Array.isArray(embedding)) {
                throw new Error('Invalid embedding format received');
            }

            return embedding;
        } catch (error) {
            console.error('Error converting text to embedding:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

const microserviceAPI = new MicroserviceAPI();
export default microserviceAPI;