import dotenv from "dotenv"
dotenv.config()
import db from "../modules/db"
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
const targetDB = db.prod

async function migrateDrillsRecommendation() {
    const drillsCollection = targetDB.collection('drills')

    const drills = fs.readFileSync(path.join(__dirname, '../temp/qb-ai-dev.drills.json'), 'utf8')
    const drillsArray = JSON.parse(drills)

    console.log(drillsArray)

    for (const drill of drillsArray) {
        if (drill.recommendationCriteria) {
            await drillsCollection.updateOne({ _id: new mongoose.Types.ObjectId(drill._id.$oid) }, { $set: { recommendationCriteria: drill.recommendationCriteria } })
            console.log('Drill updated', drill._id)
        }
    }

    console.log('Drills updated')
}

targetDB.on('open', async () => {
    await migrateDrillsRecommendation()
    process.exit(0)
})
