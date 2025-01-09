import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export const createFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, folderId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!name || !folderId) {
      logger.warn("File name or folder ID missing", req.ip);
      res.status(400).json({ message: "File name and folder ID are required" });
      return;
    }

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      logger.warn("Folder not found", req.ip);
      res.status(404).json({ message: "Folder not found" });
      return;
    }

    const newFile = await prisma.file.create({
      data: {
        name,
        folderId,
      },
    });

    logger.info("File created successfully", req.ip);
    res.status(201).json(newFile);
  } catch (error: any) {
    logger.error(`Error creating file: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error creating file" });
  }
};

export const getFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!folderId) {
      logger.warn("Folder ID missing", req.ip);
      res.status(400).json({ message: "Folder ID is required" });
      return;
    }

    const files = await prisma.file.findMany({
      where: { folderId },
    });

    logger.info("Files fetched successfully", req.ip);
    res.status(200).json(files);
  } catch (error: any) {
    logger.error(`Error fetching files: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error fetching files" });
  }
};

export const updateFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!name) {
      logger.warn("New file name or content missing", req.ip);
      res.status(400).json({ message: "New file name or content is required" });
      return;
    }

    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        name,
      },
    });

    logger.info("File updated successfully", req.ip);
    res.status(200).json(updatedFile);
  } catch (error: any) {
    logger.error(`Error updating file: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error updating file" });
  }
};

export const deleteFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await prisma.file.delete({
      where: { id },
    });

    logger.info("File deleted successfully", req.ip);
    res.status(200).json({ message: "File deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting file:", error);
    logger.error(`Error deleting file: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error deleting file" });
  }
};

export const updateFileContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      logger.warn("File not found", req.ip);
      res.status(404).json({ message: "File not found" });
      return;
    }

    if (file.content === content) {
      logger.warn("File content is the same", req.ip);
      res.status(200).json({ message: "File content is the same" });
      return;
    }

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (typeof content !== "string") {
      logger.warn("File content missing", req.ip);
      res.status(400).json({ message: "File content is required" });
      return;
    }

    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        content,
      },
    });

    logger.info("File content updated successfully", req.ip);
    res.status(200).json(updatedFile);
  } catch (error: any) {
    logger.error(`Error updating file content: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error updating file content" });
  }
};

export const getFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      logger.warn("File not found", req.ip);
      res.status(404).json({ message: "File not found" });
      return;
    }

    logger.info("File fetched successfully", req.ip);
    res.status(200).json(file);
  } catch (error: any) {
    logger.error(`Error fetching file: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error fetching file" });
  }
};
