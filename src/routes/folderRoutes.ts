import express from "express";
import { authRequire } from "../middleware";
import {
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
} from "../controllers/folderController";

const router = express.Router();

router.post("/", authRequire, createFolder);
router.get("/", authRequire, getFolders);
router.put("/:id", authRequire, updateFolder);
router.delete("/:id", authRequire, deleteFolder);

export default router; 