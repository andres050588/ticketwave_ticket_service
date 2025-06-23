import Ticket from "../models/Ticket.js"
import User from "../models/User.js"

// CREAZIONE DI UN BIGLIETTO
export const createTicket = async (req, res) => {
    try {
        const { title, price, eventDate } = req.body
        const userId = req.user.userId

        if (!req.file || !req.file.path) {
            return res.status(400).json({ error: "L'immagine è obbligatoria" })
        }
        const imageURL = req.file?.path

        // Validazioni
        if (!title || !price || !eventDate) {
            return res.status(400).json({ error: "Campi obbligatori mancanti" })
        }
        if (title.length < 3 || title.length > 100) {
            return res.status(400).json({ error: "Il titolo deve avere tra 3 e 100 caratteri" })
        }
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({ error: "Il prezzo deve essere un numero positivo" })
        }

        const newTicket = await Ticket.create({
            title,
            price,
            eventDate,
            imageURL,
            status: "disponibile",
            userId
        })

        const createdTicket = await Ticket.findByPk(newTicket.id, {
            include: {
                model: User,
                as: "Seller",
                attributes: ["id", "name", "email"]
            }
        })

        return res.status(201).json({
            id: createdTicket.id,
            title: createdTicket.title,
            price: createdTicket.price,
            eventDate: createdTicket.eventDate,
            imageURL: createdTicket.imageURL,
            status: createdTicket.status,
            createdAt: createdTicket.createdAt,
            venditore: createdTicket.Seller
        })
    } catch (error) {
        console.error("Errore durante la creazione del biglietto:", error)
        res.status(500).json({ error: "Errore del server", message: error.message, stack: error.stack })
    }
}

// LISTA BIGLIETTI DISPONIBILI
export const availableTickets = async (req, res) => {
    try {
        const tickets = await Ticket.findAll({
            where: { status: "disponibile" },
            include: [
                {
                    model: User,
                    as: "Seller",
                    attributes: ["id", "name", "email"]
                }
            ],
            order: [["createdAt", "DESC"]]
        })

        const allTickets = tickets.map(ticket => ({
            id: ticket.id,
            title: ticket.title,
            price: ticket.price,
            status: ticket.status,
            userId: ticket.userId,
            createdAt: ticket.createdAt,
            eventDate: ticket.eventDate,
            imageURL: ticket.imageURL,
            venditore: {
                id: ticket.Seller.id,
                name: ticket.Seller.name,
                email: ticket.Seller.email
            }
        }))

        res.json(allTickets)
    } catch (error) {
        console.error("Errore nel recupero dei biglietti disponibili:", error)
        res.status(500).json({ error: "Errore del server" })
    }
}

// DETTAGLIO BIGLIETTO PER ID

export const getTicketById = async (req, res) => {
    try {
        const { id } = req.params

        const ticket = await Ticket.findByPk(id, {
            include: {
                model: User,
                as: "Seller",
                attributes: ["id", "name", "email"]
            }
        })

        if (!ticket) {
            return res.status(404).json({ error: "Biglietto non trovato" })
        }

        res.json({
            id: ticket.id,
            title: ticket.title,
            price: ticket.price,
            status: ticket.status,
            userId: ticket.userId,
            createdAt: ticket.createdAt,
            eventDate: ticket.eventDate,
            imageURL: ticket.imageURL,
            venduto: ticket.status === "acquistato",
            venditore: {
                id: ticket.Seller.id,
                name: ticket.Seller.name,
                email: ticket.Seller.email
            }
        })
    } catch (error) {
        console.error("Errore nel recupero del biglietto:", error)
        res.status(500).json({ error: "Errore del server" })
    }
}

// BIGLIETTI DELL’UTENTE LOGGATO
export const getMyTickets = async (req, res) => {
    try {
        const userId = req.user.userId

        const myTickets = await Ticket.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]]
        })

        res.json(myTickets)
    } catch (error) {
        console.error("Errore nel recupero dei biglietti personali:", error)
        res.status(500).json({ error: "Errore del server" })
    }
}
