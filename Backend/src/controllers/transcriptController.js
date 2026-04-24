import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TRANSCRIPT_DIR = path.join(__dirname, "../../transcripts")

if (!fs.existsSync(TRANSCRIPT_DIR)) {
  fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true })
}

function saveTranscriptToFile(roomId, roomData) {
  try {
    const data = {
      roomId,
      customerName: roomData.customerName,
      agentName: roomData.agentName || null,
      status: roomData.status,
      startedAt: roomData.startedAt,
      endedAt: new Date().toISOString(),
      transcript: roomData.transcript
    }
    const filePath = path.join(TRANSCRIPT_DIR, `${roomId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    console.log("Transcript saved:", filePath)
  } catch (err) {
    console.log("Error saving transcript:", err.message)
  }
}

const getTranscript = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const filePath = path.join(TRANSCRIPT_DIR, `${roomId}.json`)
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "Transcript not found")
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"))
  res.json({ success: true, message: "Transcript fetched", data })
})

const getAllTranscripts = asyncHandler(async (req, res) => {
  const files = fs.readdirSync(TRANSCRIPT_DIR).filter(f => f.endsWith(".json"))
  const transcripts = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(TRANSCRIPT_DIR, f), "utf-8"))
    return {
      roomId: data.roomId,
      customerName: data.customerName,
      agentName: data.agentName,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      messageCount: data.transcript.length
    }
  })
  res.json({ success: true, message: "Transcripts fetched", data: transcripts })
})

export { saveTranscriptToFile, getTranscript, getAllTranscripts }
