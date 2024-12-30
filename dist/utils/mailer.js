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
exports.sendResetPasswordEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("./logger"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});
const sendVerificationEmail = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const verificationUrl = `http://localhost:3000/api/users/verify/${token}`;
        yield transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Verify Your Email",
            html: `Please click this link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a>`,
        });
        logger_1.default.info(`Verification email sent to ${email}`);
    }
    catch (error) {
        logger_1.default.error(`Error sending verification email: ${error.message}`);
        throw new Error(`Error sending verification email: ${error.message}`);
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendResetPasswordEmail = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resetUrl = `http://localhost:3000/api/users/reset-password/${token}`;
        yield transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Reset Your Password",
            html: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`,
        });
        logger_1.default.info(`Reset password email sent to ${email}`);
    }
    catch (error) {
        logger_1.default.error(`Error sending reset password email: ${error.message}`);
        throw new Error(`Error sending reset password email: ${error.message}`);
    }
});
exports.sendResetPasswordEmail = sendResetPasswordEmail;
