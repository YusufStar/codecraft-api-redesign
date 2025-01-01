import express from "express";
import { authRequire } from "../middleware";
import {
  createSnippet,
  deleteSnippet,
  getSnippetsByUserId,
  updateSnippet,
  createSnippetComment,
  getSnippetComments,
  updateSnippetComment,
  deleteSnippetComment,
} from "../controllers/snippetController";

const router = express.Router();

router.post("/", authRequire, createSnippet);
router.get("/user/", authRequire, getSnippetsByUserId);
router.put("/:id", authRequire, updateSnippet);
router.delete("/:id", authRequire, deleteSnippet);

router.post("/:snippetId/comments", authRequire, createSnippetComment);
router.get("/:snippetId/comments", authRequire, getSnippetComments);
router.put("/:snippetId/comments/:commentId", authRequire, updateSnippetComment);
router.delete(
  "/:snippetId/comments/:commentId",
  authRequire,
  deleteSnippetComment
);

export default router; 