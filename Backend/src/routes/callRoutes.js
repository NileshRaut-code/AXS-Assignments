import { Router } from "express"
import { getActiveCalls, getCallInfo } from "../controllers/callController.js"

const router = Router()

router.get("/", getActiveCalls)
router.get("/:roomId", getCallInfo)

export default router
