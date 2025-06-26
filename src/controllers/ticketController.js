import Ticket from "../models/ticketModel.js"
import redis from "../redisClient.js"

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
        await redis.set(`ticket:${newTicket.id}`, JSON.stringify(newTicket))
        await redis.publish(
            "ticket-creato",
            JSON.stringify({
                id: newTicket.id,
                title: newTicket.title,
                price: newTicket.price,
                eventDate: newTicket.eventDate,
                userId: newTicket.userId,
                status: newTicket.status
            })
        )

        const createdTicket = await Ticket.findByPk(newTicket.id)

        let seller = null
        const userData = await redis.get(`user:${createdTicket.userId}`)
        if (userData) {
            try {
                seller = JSON.parse(userData)
            } catch (parseError) {
                console.warn(`Dati utente corrotti in Redis per ID ${createdTicket.userId}:`, parseError)
            }
        }

        return res.status(201).json({
            id: createdTicket.id,
            title: createdTicket.title,
            price: createdTicket.price,
            eventDate: createdTicket.eventDate,
            imageURL: createdTicket.imageURL,
            status: createdTicket.status,
            createdAt: createdTicket.createdAt,
            venditore: seller
                ? {
                      id: seller.id,
                      name: seller.name,
                      email: seller.email
                  }
                : null
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
            order: [["createdAt", "DESC"]]
        })

        const allTickets = await Promise.all(
            tickets.map(async ticket => {
                let seller = null
                let fallback = false

                try {
                    const userData = await redis.get(`user:${ticket.userId}`)
                    if (userData) {
                        try {
                            seller = JSON.parse(userData)
                        } catch (parseError) {
                            console.warn(`Dati corrotti per utente ${ticket.userId}:`, parseError)
                            fallback = true
                        }
                    } else {
                        fallback = true
                    }
                } catch (redisError) {
                    console.warn(`Errore connessione Redis per utente ${ticket.userId}:`, redisError)
                    fallback = true
                }

                return {
                    id: ticket.id,
                    title: ticket.title,
                    price: ticket.price,
                    status: ticket.status,
                    userId: ticket.userId,
                    createdAt: ticket.createdAt,
                    eventDate: ticket.eventDate,
                    imageURL: ticket.imageURL,
                    venditore: seller
                        ? {
                              id: seller.id,
                              name: seller.name,
                              email: seller.email
                          }
                        : {
                              id: null,
                              name: "Non disponibile",
                              email: null
                          },
                    venditoreFallback: fallback
                }
            })
        )

        res.json(allTickets)
    } catch (error) {
        console.error("Errore nel recupero dei biglietti disponibili:", error)
        res.status(500).json({ error: "Errore del server" })
    }
}

export const getTicketById = async (req, res) => {
    try {
        const { id } = req.params

        const ticket = await Ticket.findByPk(id)
        if (!ticket) {
            return res.status(404).json({ error: "Biglietto non trovato" })
        }

        let seller = null
        let fallback = false

        try {
            const userData = await redis.get(`user:${ticket.userId}`)
            if (userData) {
                try {
                    seller = JSON.parse(userData)
                } catch (parseError) {
                    console.warn(`Dati utente corrotti in Redis per ID ${ticket.userId}:`, parseError)
                    fallback = true
                }
            } else {
                fallback = true
            }
        } catch (redisError) {
            console.warn(`Errore Redis per utente ${ticket.userId}:`, redisError)
            fallback = true
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
            venditore: seller
                ? {
                      id: seller.id,
                      name: seller.name,
                      email: seller.email
                  }
                : {
                      id: null,
                      name: "Non disponibile",
                      email: null
                  },
            venditoreFallback: fallback
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

// CANCELLARE UN BIGLIETTO

export const deleteTicket = async (request, response) => {
    const ticketId = request.params.id
    const userId = request.user.userId
    const isAdmin = request.isAdmin

    try {
        const ticketToDelete = await Ticket.findByPk(ticketId)
        if (!ticketToDelete) return response.status(404).json({ error: "Biglietto non trovato" })

        if (ticketToDelete.userId !== userId && !isAdmin) {
            return res.status(403).json({ error: "Non hai i permessi per cancellare questo biglietto" })
        }

        // Cancello dal DB e da Redis
        await ticketToDelete.destroy()
        await redis.del(`ticket:${ticketId}`)
        await redis.publish(
            "ticket-cancellato",
            JSON.stringify({
                id: ticketToDelete.id,
                userId: ticketToDelete.userId,
                title: ticketToDelete.title,
                reason: "deleted_by_owner"
            })
        )

        return res.json({ message: "Biglietto cancellato con successo" })
    } catch (error) {
        console.error("Errore nella cancellazione del biglietto:", error)
        res.status(500).json({ error: "Errore del server" })
    }
}
