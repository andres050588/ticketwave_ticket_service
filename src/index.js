import express from "express"
import sequelize from "./config/db.js"
import Ticket from "./models/ticketModel.js"
import cors from "cors"
import routerTicket from "./routes/ticketRoutes.js"
import "./events/subscriber.js"

const app = express()

// Middleware
app.use(
    cors({
        origin: "http://localhost:8080",
        credentials: true
    })
)
app.options(
    "*",
    cors({
        origin: "http://localhost:8080",
        credentials: true
    })
)
app.use(express.json())

// Routes
app.use("/api", routerTicket)

// Connessione DB + avvio server
async function startServer() {
    try {
        await sequelize.authenticate()
        console.log("Connessione al database ticket_service riuscita!")
        await sequelize.sync() // aggiungo { force: true } se voglio ressetare i dati nella db

        const PORT = process.env.PORT || 3002
        app.listen(PORT, () => {
            console.log(`Ticket service listening on port ${PORT}`)
        })
    } catch (error) {
        console.error("Errore nella connessione al DB:", error)
    }
}

startServer()
