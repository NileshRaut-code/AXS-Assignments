import { Router } from "express"
import { getTranscript, getAllTranscripts } from "../controllers/transcriptController.js"

const router = Router()

router.get("/", getAllTranscripts)
router.get("/:roomId", getTranscript)

export default router
