import express from "express";
import { fixSQL, explainSQL, completeSQL } from "../controllers/llm.controller.js";

const router = express.Router();
router.post("/fix", fixSQL);
router.post("/explain", explainSQL);
router.post("/complete", completeSQL);

export default router;
