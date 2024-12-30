"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.getUsers = exports.resendVerificationEmail = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.deleteUser = exports.updateUserProfile = exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const client_1 = require("@prisma/client");
const auth_1 = require("../utils/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
const mailer_1 = require("../utils/mailer");
const prisma = new client_1.PrismaClient();
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            logger_1.default.warn("Email, password or username missing", req.ip);
            res
                .status(400)
                .json({ message: "Email, password and username are required" });
            return;
        }
        const existingUser = yield prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });
        if (existingUser) {
            logger_1.default.warn("Email or username already exists", req.ip);
            res.status(400).json({ message: "Email or username already exists" });
            return;
        }
        const hashedPassword = (0, auth_1.hashPassword)(password);
        const newUser = yield prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
                isAdmin: false,
                isVerified: false,
            },
        });
        const verificationToken = crypto_1.default.randomBytes(20).toString("hex");
        yield prisma.user.update({
            where: { id: newUser.id },
            data: { verifyToken: verificationToken },
        });
        yield (0, mailer_1.sendVerificationEmail)(email, verificationToken);
        const token = (0, auth_1.generateToken)(newUser.id);
        logger_1.default.info("User registered successfully", req.ip);
        res
            .status(201)
            .json({ message: "User registered successfully, check email", token });
        return;
    }
    catch (error) {
        logger_1.default.error(`Error registering user: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error registering user" });
        return;
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            logger_1.default.warn("Email or password missing", req.ip);
            res.status(400).json({ message: "Email and password are required" });
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user || !(0, auth_1.comparePasswords)(password, user.password)) {
            logger_1.default.warn("Invalid email or password", req.ip);
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }
        const token = (0, auth_1.generateToken)(user.id);
        logger_1.default.info("User logged in successfully", req.ip);
        res.status(200).json({ message: "User logged in successfully", token });
        return;
    }
    catch (error) {
        logger_1.default.error(`Error logging in user: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error logging in user" });
        return;
    }
});
exports.loginUser = loginUser;
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            logger_1.default.warn("User ID not found in request", req.ip);
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            select: {
                city: true,
                codes: true,
                email: true,
                id: true,
                isAdmin: true,
                isVerified: true,
                username: true,
                createdAt: true,
                updatedAt: true,
                editorSettings: true,
                notifications: true,
                TeamMember: true,
                userAchievements: true,
                avatar: true,
            },
        });
        if (!user) {
            logger_1.default.warn("User not found", req.ip);
            res.status(404).json({ message: "User not found" });
            return;
        }
        logger_1.default.info("User fetched successfully", req.ip);
        res.status(200).json(user);
        return;
    }
    catch (error) {
        logger_1.default.error(`Error fetching user: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error fetching user" });
        return;
    }
});
exports.getUserProfile = getUserProfile;
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { username, city, avatar } = req.body;
        if (!userId) {
            logger_1.default.warn("User ID not found in request", req.ip);
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const updatedUser = yield prisma.user.update({
            where: { id: userId },
            data: {
                username,
                city,
                avatar,
            },
        });
        logger_1.default.info("User updated successfully", req.ip);
        res.status(200).json({ message: "User updated successfully", updatedUser });
        return;
    }
    catch (error) {
        logger_1.default.error(`Error updating user: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error updating user" });
        return;
    }
});
exports.updateUserProfile = updateUserProfile;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            logger_1.default.warn("User ID not found in request", req.ip);
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        yield prisma.user.delete({
            where: { id: userId },
        });
        logger_1.default.info("User deleted successfully", req.ip);
        res.status(200).json({ message: "User deleted successfully" });
        return;
    }
    catch (error) {
        logger_1.default.error(`Error deleting user: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error deleting user" });
        return;
    }
});
exports.deleteUser = deleteUser;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        if (!token) {
            logger_1.default.warn("Verification token missing", req.ip);
            res.status(400).json({ message: "Verification token is required" });
            return;
        }
        const user = yield prisma.user.findFirst({
            where: { verifyToken: token },
        });
        if (!user) {
            logger_1.default.warn("Invalid verification token", req.ip);
            res.status(400).json({ message: "Invalid verification token" });
            return;
        }
        yield prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verifyToken: null },
        });
        logger_1.default.info("Email verified successfully", req.ip);
        res.status(200).json({ message: "Email verified successfully" });
        return;
    }
    catch (error) {
        logger_1.default.error(`Error verifying email: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error verifying email" });
        return;
    }
});
exports.verifyEmail = verifyEmail;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            logger_1.default.warn("Email missing", req.ip);
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            logger_1.default.warn("User not found with provided email", req.ip);
            res.status(404).json({ message: "User not found with provided email" });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(20).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // Token expires in 1 hour
        yield prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry },
        });
        yield (0, mailer_1.sendResetPasswordEmail)(email, resetToken);
        logger_1.default.info("Reset password email sent successfully", req.ip);
        res
            .status(200)
            .json({ message: "Reset password email sent successfully, check email" });
        return;
    }
    catch (error) {
        logger_1.default.error(`Error sending reset password email: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error sending reset password email" });
        return;
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!token || !password) {
            logger_1.default.warn("Token or password missing", req.ip);
            res.status(400).json({ message: "Token and password are required" });
            return;
        }
        const user = yield prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() },
            },
        });
        if (!user) {
            logger_1.default.warn("Invalid or expired reset token", req.ip);
            res.status(400).json({ message: "Invalid or expired reset token" });
            return;
        }
        const hashedPassword = (0, auth_1.hashPassword)(password);
        yield prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        logger_1.default.info("Password reset successfully", req.ip);
        res.status(200).json({ message: "Password reset successfully" });
        return;
    }
    catch (error) {
        logger_1.default.error(`Error resetting password: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error resetting password" });
        return;
    }
});
exports.resetPassword = resetPassword;
const resendVerificationEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            logger_1.default.warn("Email missing", req.ip);
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            logger_1.default.warn("User not found with provided email", req.ip);
            res.status(404).json({ message: "User not found with provided email" });
            return;
        }
        if (user.isVerified) {
            logger_1.default.warn("User is already verified", req.ip);
            res.status(400).json({ message: "User is already verified" });
            return;
        }
        const verificationToken = crypto_1.default.randomBytes(20).toString("hex");
        yield prisma.user.update({
            where: { id: user.id },
            data: { verifyToken: verificationToken },
        });
        yield (0, mailer_1.sendVerificationEmail)(email, verificationToken);
        logger_1.default.info("Verification email resent successfully", req.ip);
        res
            .status(200)
            .json({ message: "Verification email resent successfully, check email" });
        return;
    }
    catch (error) {
        logger_1.default.error(`Error resending verification email: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error resending verification email" });
        return;
    }
});
exports.resendVerificationEmail = resendVerificationEmail;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                isAdmin: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        logger_1.default.info("Users fetched successfully", req.ip);
        res.status(200).json(users);
        return;
    }
    catch (error) {
        logger_1.default.error(`Error fetching users: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error fetching users" });
        return;
    }
});
exports.getUsers = getUsers;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            logger_1.default.warn("User ID missing", req.ip);
            res.status(400).json({ message: "User ID is required" });
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { id },
            select: {
                city: true,
                codes: true,
                email: true,
                id: true,
                isAdmin: true,
                isVerified: true,
                username: true,
                createdAt: true,
                updatedAt: true,
                editorSettings: true,
                notifications: true,
                TeamMember: true,
                userAchievements: true,
                avatar: true,
            },
        });
        if (!user) {
            logger_1.default.warn("User not found", req.ip);
            res.status(404).json({ message: "User not found" });
            return;
        }
        logger_1.default.info("User fetched successfully", req.ip);
        res.status(200).json(user);
        return;
    }
    catch (error) {
        logger_1.default.error(`Error fetching user: ${error.message}`, req.ip);
        res.status(500).json({ message: "Error fetching user" });
        return;
    }
});
exports.getUserById = getUserById;
