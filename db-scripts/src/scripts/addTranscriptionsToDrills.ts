import dotenv from "dotenv"
dotenv.config()
import db from "../modules/db"
import axios from 'axios'
import mongoose from 'mongoose'
const targetDB = db.dev

interface TranscriptionResponse {
  transcriptionText: string;
  embedding: number[];
}

async function getVimeoTranscription(vimeoId: string): Promise<TranscriptionResponse | null> {
  try {
    console.log(`Making request to /vimeo/texttracks/${vimeoId}`);
    const response = await axios.get(
      `http://localhost:4001/vimeo/texttracks/${vimeoId}`,
      {
        headers: {
          'x-api-key': process.env.MICROSERVICE_API_TOKEN
        }
      }
    );

    console.log("Full response:", response);
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    console.log("Response data:", response.data);
    
    if (response.data.transcriptionText && response.data.embedding) {
      console.log("Found transcription and embedding in response");
      return {
        transcriptionText: response.data.transcriptionText,
        embedding: response.data.embedding
      };
    }
    console.log("No transcription or embedding found in response");
    return null;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to fetch transcription for ${vimeoId}:`, error.message);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
    } else {
      console.error(`Failed to fetch transcription for ${vimeoId}: Unknown error`);
    }
    return null;
  }
}

async function processBatch(drills: any[], startIndex: number, batchSize: number) {
    const endIndex = Math.min(startIndex + batchSize, drills.length);
    console.log(`\nProcessing batch ${startIndex + 1} to ${endIndex} of ${drills.length}...`);
    
    for (let i = startIndex; i < endIndex; i++) {
        const drill = drills[i];
        const match = drill.videoLink?.match(/vimeo\.com\/(\d+)/);

        if (!match) {
            console.log(`Skipping drill ${drill._id}: Invalid Vimeo URL`);
            continue;
        }
        const vimeoId = match[1];

        console.log(`Processing drill ${drill._id} with Vimeo ID ${vimeoId}...`);
        const result = await getVimeoTranscription(vimeoId);

        if (result) {
            await targetDB.collection('drills').updateOne(
                { _id: drill._id },
                { 
                    $set: { 
                        videoTranscription: result.transcriptionText,
                        videoEmbedding: result.embedding
                    } 
                }
            );
            console.log(`Updated drill ${drill._id} with transcription and embedding.`);
        } else {
            console.log(`No transcription or embedding found for drill ${drill._id}.`);
        }
    }
}

async function addTranscriptionsToDrills() {
    const drillsCollection = targetDB.collection('drills');
    const drills = await drillsCollection.find({}).toArray();
    const BATCH_SIZE = 3; // Process 3 drills at a time

    console.log(`Found ${drills.length} drills to process`);

    for (let i = 0; i < drills.length; i += BATCH_SIZE) {
        await processBatch(drills, i, BATCH_SIZE);
    }

    console.log('\nAll drills processed');
}

targetDB.on('open', async () => {
    await addTranscriptionsToDrills();
    process.exit(0);
});
