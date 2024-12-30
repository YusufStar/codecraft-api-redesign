import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { generateToken, hashPassword, comparePasswords } from "../utils/auth";
import logger from "../utils/logger";
import crypto from "crypto";
import { sendResetPasswordEmail, sendVerificationEmail } from "../utils/mailer";

const prisma = new PrismaClient();

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      logger.warn("Email, password or username missing", req.ip);
      res
        .status(400)
        .json({ message: "Email, password and username are required" });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      logger.warn("Email or username already exists", req.ip);
      res.status(400).json({ message: "Email or username already exists" });
      return;
    }

    const hashedPassword = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        isAdmin: false,
        isVerified: false,
      },
    });

    const verificationToken = crypto.randomBytes(20).toString("hex");
    await prisma.user.update({
      where: { id: newUser.id },
      data: { verifyToken: verificationToken },
    });

    // await sendVerificationEmail(email, verificationToken);

    const token = generateToken(newUser.id);
    logger.info("User registered successfully", req.ip);
    res
      .status(201)
      .json({ message: "User registered successfully, check email", token });
    return;
  } catch (error: any) {
    logger.error(`Error registering user: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error registering user" });
    return;
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn("Email or password missing", req.ip);
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !comparePasswords(password, user.password)) {
      logger.warn("Invalid email or password", req.ip);
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = generateToken(user.id);
    logger.info("User logged in successfully", req.ip);
    res.status(200).json({ message: "User logged in successfully", token });
    return;
  } catch (error: any) {
    logger.error(`Error logging in user: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error logging in user" });
    return;
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        city: true,
        email: true,
        id: true,
        isAdmin: true,
        isVerified: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
      },
    });

    if (!user) {
      logger.warn("User not found", req.ip);
      res.status(404).json({ message: "User not found" });
      return;
    }

    logger.info("User fetched successfully", req.ip);
    res.status(200).json(user);
    return;
  } catch (error: any) {
    logger.error(`Error fetching user: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error fetching user" });
    return;
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { username, city, avatar } = req.body;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        city,
        avatar,
      },
    });

    logger.info("User updated successfully", req.ip);
    res.status(200).json({ message: "User updated successfully", updatedUser });
    return;
  } catch (error: any) {
    logger.error(`Error updating user: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error updating user" });
    return;
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info("User deleted successfully", req.ip);
    res.status(200).json({ message: "User deleted successfully" });
    return;
  } catch (error: any) {
    logger.error(`Error deleting user: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error deleting user" });
    return;
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      logger.warn("Verification token missing", req.ip);
      res.status(400).json({ message: "Verification token is required" });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      logger.warn("Invalid verification token", req.ip);
      res.status(400).json({ message: "Invalid verification token" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    });

    logger.info("Email verified successfully", req.ip);
    res.status(200).json({ message: "Email verified successfully" });
    return;
  } catch (error: any) {
    logger.error(`Error verifying email: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error verifying email" });
    return;
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      logger.warn("Email missing", req.ip);
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn("User not found with provided email", req.ip);
      res.status(404).json({ message: "User not found with provided email" });
      return;
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Token expires in 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    await sendResetPasswordEmail(email, resetToken);

    logger.info("Reset password email sent successfully", req.ip);
    res
      .status(200)
      .json({ message: "Reset password email sent successfully, check email" });
    return;
  } catch (error: any) {
    logger.error(
      `Error sending reset password email: ${error.message}`,
      req.ip
    );
    res.status(500).json({ message: "Error sending reset password email" });
    return;
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      logger.warn("Token or password missing", req.ip);
      res.status(400).json({ message: "Token and password are required" });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      logger.warn("Invalid or expired reset token", req.ip);
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    const hashedPassword = hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    logger.info("Password reset successfully", req.ip);
    res.status(200).json({ message: "Password reset successfully" });
    return;
  } catch (error: any) {
    logger.error(`Error resetting password: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error resetting password" });
    return;
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      logger.warn("Email missing", req.ip);
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn("User not found with provided email", req.ip);
      res.status(404).json({ message: "User not found with provided email" });
      return;
    }

    if (user.isVerified) {
      logger.warn("User is already verified", req.ip);
      res.status(400).json({ message: "User is already verified" });
      return;
    }

    const verificationToken = crypto.randomBytes(20).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: verificationToken },
    });

    await sendVerificationEmail(email, verificationToken);

    logger.info("Verification email resent successfully", req.ip);
    res
      .status(200)
      .json({ message: "Verification email resent successfully, check email" });
    return;
  } catch (error: any) {
    logger.error(
      `Error resending verification email: ${error.message}`,
      req.ip
    );
    res.status(500).json({ message: "Error resending verification email" });
    return;
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
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

    logger.info("Users fetched successfully", req.ip);
    res.status(200).json(users);
    return;
  } catch (error: any) {
    logger.error(`Error fetching users: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error fetching users" });
    return;
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      logger.warn("User ID missing", req.ip);
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        city: true,
        email: true,
        id: true,
        isAdmin: true,
        isVerified: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
      },
    });

    if (!user) {
      logger.warn("User not found", req.ip);
      res.status(404).json({ message: "User not found" });
      return;
    }

    logger.info("User fetched successfully", req.ip);
    res.status(200).json(user);
    return;
  } catch (error: any) {
    logger.error(`Error fetching user: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error fetching user" });
    return;
  }
};
