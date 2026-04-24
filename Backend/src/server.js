import "dotenv/config"
import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import callRoutes from "./routes/callRoutes.js"
import transcriptRoutes from "./routes/transcriptRoutes.js"
import recordingRoutes from "./routes/recordingRoutes.js"
import setupSocket from "./socket/socketHandler.js"

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

app.use("/api/calls", callRoutes)
app.use("/api/transcripts", transcriptRoutes)
app.use("/api/recordings", recordingRoutes)

setupSocket(io)

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    data: null
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
