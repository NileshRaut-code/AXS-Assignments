import { Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

const recordingsDir = path.join(__dirname, "../../recordings")
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, recordingsDir),
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage })

router.post("/upload", upload.single("audio"), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No audio file provided")
  }
  res.json({ success: true, message: "Recording saved", data: { filename: req.file.filename } })
}))

router.get("/", asyncHandler(async (req, res) => {
  const files = fs.readdirSync(recordingsDir).filter(f => f.endsWith(".webm"))
  const data = files.map(f => ({
    filename: f,
    size: fs.statSync(path.join(recordingsDir, f)).size
  }))
  res.json({ success: true, message: "Recordings fetched", data })
}))

export default router
