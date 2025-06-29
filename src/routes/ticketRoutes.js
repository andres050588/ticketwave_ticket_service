import express from "express"
import { createTicket, getTicketById, availableTickets, getMyTickets } from "../controllers/ticketController.js"
import { verifyToken, verifyAdmin } from "../middleware/verifyToken.js"
import multerUpload from "../middleware/multerUpload.js"

const routerTickets = express.Router()

// POST /api/tickets creazione del biglietto ed upload con multer della photo biglietto
routerTickets.post("/tickets", verifyToken, multerUpload.single("image"), createTicket)
// GET /api/tickets/:id - ritorna info dell biglietto scelto
routerTickets.get("/tickets/:id", getTicketById)
// GET /api/tickets - ritorna tutti i biglietti disponibili da ../controllers/ticketController.js
routerTickets.get("/tickets", availableTickets)
// GET /api/mytickets - ritorna la lista dei biglietti dell'utente loggato
routerTickets.get("tickets/mytickets", verifyToken, getMyTickets)

// Fallback: cattura rotte non definite
routerTickets.all("/*", (req, res) => {
    res.status(404).json({ message: "Endpoint non trovato in /api/tickets" })
})

export default routerTickets
