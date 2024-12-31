import express from "express";
import { build } from "../controllers/buildController";
import { authRequire } from "../middleware";

const router = express.Router();

router.post("/", authRequire, build);

export default router;
