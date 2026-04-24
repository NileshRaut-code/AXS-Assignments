import { activeRooms } from "../store.js"
import { getAiResponse } from "../utils/aiAgent.js"
import { saveTranscriptToFile } from "../controllers/transcriptController.js"

function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("start-call", (data) => {
      const roomId = `room-${Date.now()}`
      activeRooms.set(roomId, {
        id: roomId,
        customerId: socket.id,
        customerName: data.name || "Customer",
        agentId: null,
        agentName: null,
        status: "ai",
        transcript: [],
        startedAt: new Date().toISOString()
      })

      socket.join(roomId)
      socket.roomId = roomId
      socket.emit("call-started", { roomId })

      const welcomeMsg = {
        sender: "ai",
        text: "Hello! Welcome to our support line. How can I help you today?",
        timestamp: new Date().toISOString()
      }
      activeRooms.get(roomId).transcript.push(welcomeMsg)
      io.to(roomId).emit("transcript-update", welcomeMsg)
      io.emit("active-calls-updated", getActiveCallsList())
    })

    socket.on("customer-message", (data) => {
      const room = activeRooms.get(data.roomId)
      if (!room) return

      const customerMsg = {
        sender: "customer",
        text: data.text,
        timestamp: new Date().toISOString()
      }
      room.transcript.push(customerMsg)
      io.to(data.roomId).emit("transcript-update", customerMsg)
      io.emit("active-calls-updated", getActiveCallsList())

      if (room.status === "ai") {
        const delay = 1000 + Math.random() * 1500
        setTimeout(() => {
          const aiText = getAiResponse(data.text)
          const aiMsg = {
            sender: "ai",
            text: aiText,
            timestamp: new Date().toISOString()
          }
          room.transcript.push(aiMsg)
          io.to(data.roomId).emit("transcript-update", aiMsg)
          io.emit("active-calls-updated", getActiveCallsList())
        }, delay)
      }
    })

    socket.on("agent-message", (data) => {
      const room = activeRooms.get(data.roomId)
      if (!room) return

      const agentMsg = {
        sender: "agent",
        text: data.text,
        timestamp: new Date().toISOString()
      }
      room.transcript.push(agentMsg)
      io.to(data.roomId).emit("transcript-update", agentMsg)
      io.emit("active-calls-updated", getActiveCallsList())
    })

    socket.on("request-transfer", (data) => {
      const room = activeRooms.get(data.roomId)
      if (!room) return

      room.status = "waiting"
      const sysMsg = {
        sender: "system",
        text: "Customer has requested to speak with a human agent. Please wait...",
        timestamp: new Date().toISOString()
      }
      room.transcript.push(sysMsg)
      io.to(data.roomId).emit("transcript-update", sysMsg)
      io.emit("transfer-requested", { roomId: data.roomId, customerName: room.customerName })
      io.emit("active-calls-updated", getActiveCallsList())
    })

    socket.on("accept-transfer", (data) => {
      const room = activeRooms.get(data.roomId)
      if (!room || room.status !== "waiting") {
        socket.emit("transfer-failed", { message: "Call is no longer available" })
        return
      }

      room.agentId = socket.id
      room.agentName = data.agentName || "Agent"
      room.status = "human"

      socket.join(data.roomId)
      socket.roomId = data.roomId

      socket.emit("call-transcript", { roomId: data.roomId, transcript: room.transcript })

      const sysMsg = {
        sender: "system",
        text: `${room.agentName} has joined the call.`,
        timestamp: new Date().toISOString()
      }
      room.transcript.push(sysMsg)
      io.to(data.roomId).emit("transcript-update", sysMsg)
      io.to(data.roomId).emit("agent-joined", {
        agentId: socket.id,
        agentName: room.agentName
      })
      io.emit("active-calls-updated", getActiveCallsList())
    })

    socket.on("offer", (data) => {
      socket.to(data.roomId).emit("offer", {
        offer: data.offer,
        from: socket.id
      })
    })

    socket.on("answer", (data) => {
      socket.to(data.roomId).emit("answer", {
        answer: data.answer,
        from: socket.id
      })
    })

    socket.on("ice-candidate", (data) => {
      socket.to(data.roomId).emit("ice-candidate", {
        candidate: data.candidate,
        from: socket.id
      })
    })

    socket.on("end-call", (data) => {
      const room = activeRooms.get(data.roomId)
      if (!room) return
      handleCallEnd(io, data.roomId, room)
    })

    socket.on("rejoin", (data) => {
      const room = activeRooms.get(data.roomId)
      if (room) {
        socket.join(data.roomId)
        socket.roomId = data.roomId
        socket.emit("call-transcript", { roomId: data.roomId, transcript: room.transcript })
      }
    })

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
      for (const [roomId, room] of activeRooms) {
        if (room.customerId === socket.id || room.agentId === socket.id) {
          handleCallEnd(io, roomId, room)
          break
        }
      }
    })
  })
}

function handleCallEnd(io, roomId, room) {
  const sysMsg = {
    sender: "system",
    text: "Call ended.",
    timestamp: new Date().toISOString()
  }
  room.transcript.push(sysMsg)
  io.to(roomId).emit("call-ended", { roomId })

  if (room.transcript.length > 0) {
    saveTranscriptToFile(roomId, room)
  }

  activeRooms.delete(roomId)
  io.emit("active-calls-updated", getActiveCallsList())
}

function getActiveCallsList() {
  const calls = []
  for (const [id, room] of activeRooms) {
    calls.push({
      id: room.id,
      customerName: room.customerName,
      status: room.status,
      agentName: room.agentName || null,
      transcript: room.transcript,
      startedAt: room.startedAt
    })
  }
  return calls
}

export default setupSocket
