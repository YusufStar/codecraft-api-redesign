import nodemailer from "nodemailer";
import logger from "./logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  try {
    const verificationUrl = `http://localhost:3000/api/users/verify/${token}`;
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Verify Your Email",
      html: `Please click this link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a>`,
    });
    logger.info(`Verification email sent to ${email}`);
  } catch (error: any) {
    logger.error(`Error sending verification email: ${error.message}`);
    throw new Error(`Error sending verification email: ${error.message}`);
  }
};

export const sendResetPasswordEmail = async (
  email: string,
  token: string
): Promise<void> => {
  try {
    const resetUrl = `http://localhost:3000/api/users/reset-password/${token}`;
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Reset Your Password",
      html: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`,
    });
    logger.info(`Reset password email sent to ${email}`);
  } catch (error: any) {
    logger.error(`Error sending reset password email: ${error.message}`);
    throw new Error(`Error sending reset password email: ${error.message}`);
  }
};
