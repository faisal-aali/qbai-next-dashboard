import dotenv from "dotenv"
dotenv.config()
import db from "../modules/db"

const targetDB = db.dev

async function migrateTicketsMessages() {
    console.log('starting script')
    console.log('targetDB', targetDB.name)

    const ticketsCollection = targetDB.collection('tickets')
    const messagesCollection = targetDB.collection('tickets_messages')

    const tickets = await ticketsCollection.find({}).toArray()
    const messages = await messagesCollection.find({}).toArray()

    const deletedMessages = await messagesCollection.deleteMany({})
    console.log('deleted messages', deletedMessages.deletedCount)

    const insertions = []

    for (const ticket of tickets) {
        insertions.push({
            ticketObjectId: ticket._id,
            userId: ticket.userId,
            message: ticket.message || '',
            attachments: ticket.attachments || [],
            viewedBy: ticket.viewedBy || [],
            creationDate: new Date(ticket.creationDate)
        })

        if (ticket.comment) {
            insertions.push({
                ticketObjectId: ticket._id,
                userId: ticket.closedBy,
                message: ticket.comment || '',
                attachments: [],
                viewedBy: ticket.viewedBy || [],
                creationDate: new Date(ticket.closingDate)
            })
        }
    }

    console.log('total insertions', insertions.length)

    await messagesCollection.insertMany(insertions)
    console.log('inserted messages', insertions.length)

    console.log('script finished')
}

targetDB.on('open', async () => {
    await migrateTicketsMessages()
    process.exit(0)
})
