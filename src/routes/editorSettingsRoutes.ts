import express from "express";
import { authRequire } from "../middleware";
import { getEditorSettings, updateEditorSettings } from "../controllers/editorSettingsController";

const router = express.Router();

router.get("/", authRequire, getEditorSettings);
router.put("/", authRequire, updateEditorSettings);

export default router; 