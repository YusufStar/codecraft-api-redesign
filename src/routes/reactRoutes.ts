import express from "express";
import {
  creteApp,
  getAllProjects,
  getDependency,
  addDependency,
  removeDependency,
  runProject,
  getProjectFiles,
  updateFileName,
  updateFileContent,
  updateFolderName,
  deleteFile,
} from "../controllers/reactController";
import { authRequire } from "../middleware";

const router = express.Router();

router.post("/", authRequire, creteApp);
router.get("/", authRequire, getAllProjects);
router.get("/:projectId/dependencies", authRequire, getDependency);
router.post("/:projectId/dependencies", authRequire, addDependency);
router.delete("/:projectId/dependencies", authRequire, removeDependency);
router.post("/:projectId/run", authRequire, runProject);
router.get("/:projectId/files", authRequire, getProjectFiles);
router.put("/:projectId/files/name", authRequire, updateFileName);
router.put("/:projectId/files/content", authRequire, updateFileContent);
router.put("/:projectId/folders/name", authRequire, updateFolderName);
router.delete("/:projectId/files", authRequire, deleteFile);

export default router;
