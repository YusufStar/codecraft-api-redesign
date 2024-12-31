import express from "express";
import { authRequire } from "../middleware";
import {
  createSnippet,
  deleteSnippet,
  getSnippetsByUserId,
  updateSnippet,
} from "../controllers/snippetController";

const router = express.Router();

router.post("/", authRequire, createSnippet);
router.get("/user/", authRequire, getSnippetsByUserId);
router.put("/:id", authRequire, updateSnippet);
router.delete("/:id", authRequire, deleteSnippet);

export default router; 