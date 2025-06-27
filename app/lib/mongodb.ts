// const mysql = require('mysql');
// // import mysql from 'mysql'

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT,
//     database: process.env.DB_DATABASE,
// });

// export default pool;
import mongoose from 'mongoose'

mongoose.connect(process.env.MONGO_URI as string, { dbName: process.env.ENVIRONMENT === 'prod' ? 'qm-ai' : 'qm-ai-dev' }).then(() => console.log('connection established with db')).catch(console.error)

export default mongoose