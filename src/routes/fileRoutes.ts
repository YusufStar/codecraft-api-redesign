import express from "express";
import { authRequire } from "../middleware";
import {
  createFile,
  getFiles,
  updateFile,
  deleteFile,
  updateFileContent,
  getFile,
} from "../controllers/fileController";

const router = express.Router();

router.post("/", authRequire, createFile);
router.get("/:folderId", authRequire, getFiles);
router.put("/:id", authRequire, updateFile);
router.delete("/:id", authRequire, deleteFile);
router.put("/code/:id", authRequire, updateFileContent);
router.get("/:id", getFile);

export default router; 