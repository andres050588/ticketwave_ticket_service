// subscriber.js
import redis from "../redisClient.js"

function startRedisSubscribers() {
    // Iscrizione al canale "user-aggiornato"
    redis.subscribe("user-aggiornato", message => {
        try {
            const updatedUser = JSON.parse(message)
            if (!updatedUser || typeof updatedUser !== "object" || Array.isArray(updatedUser)) {
                console.warn("Messaggio non valido: expected an object but got:", updatedUser)
                return
            }

            if (!updatedUser.id || (!updatedUser.name && !updatedUser.email)) {
                console.warn("Messaggio incompleto ricevuto su 'user-aggiornato':", updatedUser)
                return
            }

            redis.set(
                `user:${updatedUser.id}`,
                JSON.stringify({
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email
                })
            )

            console.log(`🔁 Redis aggiornato per utente ${updatedUser.id}`)
        } catch (err) {
            console.error("Messaggio non valido ricevuto su 'user-aggiornato':", err)
        }
    })
}

startRedisSubscribers()
