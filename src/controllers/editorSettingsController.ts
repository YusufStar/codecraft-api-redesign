import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export const getEditorSettings = async (
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

    let editorSettings = await prisma.editorSettings.findUnique({
      where: { userId },
    });

    if (!editorSettings) {
      // Create default editor settings if not found
      editorSettings = await prisma.editorSettings.create({
        data: {
          userId,
          fontSize: 14,
          theme: "dark-plus",
          tabSize: 2,
          wordWrap: true,
          autoSave: false,
          lineNumbers: true,
          minimap: false,
        },
      });
      logger.info("Default editor settings created", req.ip);
    }

    logger.info("Editor settings fetched successfully", req.ip);
    res.status(200).json(editorSettings);
  } catch (error: any) {
    logger.error(`Error fetching editor settings: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error fetching editor settings" });
  }
};

export const updateEditorSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const data = req.body;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const updatedEditorSettings = await prisma.editorSettings.update({
      where: { userId },
      data: {
        fontSize: data.fontSize,
        theme: data.theme,
        tabSize: data.tabSize,
        wordWrap: data.wordWrap,
        autoSave: data.autoSave,
        lineNumbers: data.lineNumbers,
        minimap: data.minimap,
      },
    });

    logger.info("Editor settings updated successfully", req.ip);
    res.status(200).json(updatedEditorSettings);
  } catch (error: any) {
    logger.error(`Error updating editor settings: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error updating editor settings" });
  }
};
