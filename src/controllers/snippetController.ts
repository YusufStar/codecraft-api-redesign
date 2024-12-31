import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export const createSnippet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!name || !content) {
      logger.warn("Snippet name or content missing", req.ip);
      res.status(400).json({ message: "Snippet name and content are required" });
      return;
    }

    const existingSnippet = await prisma.snippets.findUnique({
      where: {
        name: name,
      },
    });

    if (existingSnippet) {
      logger.warn("Snippet already exists", req.ip);
      res.status(400).json({ message: "Snippet already exists" });
      return;
    }

    const newSnippet = await prisma.snippets.create({
      data: {
        name,
        content,
        userId,
      },
    });

    logger.info("Snippet created successfully", req.ip);
    res.status(201).json(newSnippet);
  } catch (error: any) {
    logger.error(`Error creating snippet: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error creating snippet" });
  }
};

export const getSnippetsByUserId = async (
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

    const snippets = await prisma.snippets.findMany({
      where: { userId },
    });

    logger.info("Snippets fetched successfully", req.ip);
    res.status(200).json(snippets);
  } catch (error: any) {
    logger.error(`Error fetching snippets: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error fetching snippets" });
  }
};

export const updateSnippet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!name || !content) {
      logger.warn("New snippet name or content missing", req.ip);
      res
        .status(400)
        .json({ message: "New snippet name or content is required" });
      return;
    }

    const updatedSnippet = await prisma.snippets.update({
      where: { id },
      data: {
        name,
        content,
      },
    });

    logger.info("Snippet updated successfully", req.ip);
    res.status(200).json(updatedSnippet);
  } catch (error: any) {
    logger.error(`Error updating snippet: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error updating snippet" });
  }
};

export const deleteSnippet = async (
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

    await prisma.snippets.delete({
      where: { id },
    });

    logger.info("Snippet deleted successfully", req.ip);
    res.status(200).json({ message: "Snippet deleted successfully" });
  } catch (error: any) {
    logger.error(`Error deleting snippet: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error deleting snippet" });
  }
}; 