import express from "express"
import sequelize from "./config/db.js"
import Ticket from "./models/ticketModel.js"
import dotenv from "dotenv"
import cors from "cors"
import routerTicket from "./routes/ticketRoutes.js"

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Rotte
app.use("/api", routerTicket)

// Connessione DB + avvio server
async function startServer() {
    try {
        await sequelize.authenticate()
        console.log("✅ Connessione al database ticket_service riuscita!")
        await sequelize.sync({ force: true })

        const PORT = process.env.PORT || 3002
        app.listen(PORT, () => {
            console.log(`Ticket service listening on port ${PORT}`)
        })
    } catch (error) {
        console.error("Errore nella connessione al DB:", error)
    }
}

startServer()
