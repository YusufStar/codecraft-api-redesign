"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../middleware");
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
router.post("/register", userController_1.registerUser);
router.post("/login", userController_1.loginUser);
router.get("/verify/:token", userController_1.verifyEmail);
router.post("/resend-verification", userController_1.resendVerificationEmail);
router.post("/forgot-password", userController_1.forgotPassword);
router.post("/reset-password/:token", userController_1.resetPassword);
// Auth required routes
router.get("/me", middleware_1.authRequire, userController_1.getUserProfile);
router.put("/me", middleware_1.authRequire, userController_1.updateUserProfile);
router.delete("/me", middleware_1.authRequire, userController_1.deleteUser);
router.get("/", middleware_1.authRequire, userController_1.getUsers);
router.get("/:id", middleware_1.authRequire, userController_1.getUserById);
exports.default = router;
