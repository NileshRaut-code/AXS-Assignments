import { activeRooms } from "../store.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"

const getActiveCalls = asyncHandler(async (req, res) => {
  const calls = []
  for (const [id, room] of activeRooms) {
    calls.push({
      id: room.id,
      customerName: room.customerName,
      status: room.status,
      agentName: room.agentName || null,
      startedAt: room.startedAt,
      transcriptLength: room.transcript.length
    })
  }
  res.json({ success: true, message: "Active calls fetched", data: calls })
})

const getCallInfo = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const room = activeRooms.get(roomId)
  if (!room) {
    throw new ApiError(404, "Call not found")
  }
  res.json({
    success: true,
    message: "Call info fetched",
    data: {
      id: room.id,
      customerName: room.customerName,
      status: room.status,
      agentName: room.agentName || null,
      startedAt: room.startedAt,
      transcript: room.transcript
    }
  })
})

export { getActiveCalls, getCallInfo }
