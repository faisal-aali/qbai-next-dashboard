const mongoose = require('mongoose');

mongoose.set('strictQuery', false)

const db = {
    prod: mongoose.createConnection(process.env.MONGO_URI, { dbName: 'qb-ai' }),
    dev: mongoose.createConnection(process.env.MONGO_URI, { dbName: 'qb-ai-dev' }),
}

db.prod.on('open', () => console.log('Prod DB connected'))
db.dev.on('open', () => console.log('Dev DB connected'))
db.prod.on('error', (err: any) => console.error(err))
db.dev.on('error', (err: any) => console.error(err))

export default db