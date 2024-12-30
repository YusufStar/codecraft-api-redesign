import express from "express";
import { authRequire } from "../middleware";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  getUsers,
  getUserById,
} from "../controllers/userController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Auth required routes
router.get("/me", authRequire, getUserProfile);
router.put("/me", authRequire, updateUserProfile);
router.delete("/me", authRequire, deleteUser);
router.get("/", authRequire, getUsers);
router.get("/:id", authRequire, getUserById);

export default router;
