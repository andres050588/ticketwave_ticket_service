import express from "express"

const app = express()

// avvio server
try {
    const PORT = process.env.PORT || 3002
    app.listen(PORT, () => {
        console.log(` Ticket service in ascolto sulla porta ${PORT}`)
    })
} catch (error) {
    console.error(" Errore connessione DB:", error)
}
