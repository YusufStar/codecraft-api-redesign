import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export const createFolder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, parentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!name) {
      logger.warn("Folder name missing", req.ip);
      res.status(400).json({ message: "Folder name is required" });
      return;
    }

    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: {
          id: parentId,
        },
      });

      if (!parentFolder) {
        logger.warn("Parent folder not found", req.ip);
        res.status(400).json({ message: "Parent folder not found" });
        return;
      }
    }

    const existingFolder = await prisma.folder.findUnique({
      where: {
        userId_name: {
          userId: userId,
          name: name,
        },
      },
    });

    if (existingFolder) {
      logger.warn("Folder already exists", req.ip);
      res.status(400).json({ message: "Folder already exists" });
      return;
    }

    const newFolder = await prisma.folder.create({
      data: {
        name: name,
        userId: userId,
        parentId: parentId,
      },
    });

    logger.info("Folder created successfully", req.ip);
    res.status(201).json(newFolder);
  } catch (error: any) {
    logger.error(`Error creating folder: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error creating folder" });
  }
};

export const getFolders = async (
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

    // Fetch all folders for the user
    const allFolders = await prisma.folder.findMany({
      where: {
        userId: userId,
      },
      include: {
        files: true,
        children: {
          include: {
            files: true,
            children: {
              include: {
                files: true,
                children: true, // Recursively include children's children and files
              },
            },
          },
        },
      },
    });

    // Recursively sort files and children
    const sortFolders = (folder: any) => {
      if (folder.files) {
        folder.files.sort((a: any, b: any) => a.name.localeCompare(b.name));
      }
      if (folder.children) {
        folder.children.sort((a: any, b: any) => a.name.localeCompare(b.name));
        folder.children.forEach(sortFolders);
      }
    };

    // Instead of filtering for root folders, check if allFolders is empty
    if (allFolders.length === 0) {
      logger.info("No folders found for the user", req.ip);
      res.status(200).json([]);
      return;
    }

    // Find the root folder (the folder that is not a child of any other folder)
    const rootFolder = allFolders.find(
      (folder) =>
        !allFolders.some((f) => f.children.some((c) => c.id === folder.id))
    );

    // If no root folder is found, return all folders (this should not happen if the data is consistent)
    if (!rootFolder) {
      logger.warn("No root folder found, returning all folders", req.ip);

      // Sort all folders (this is a fallback solution)
      allFolders.forEach(sortFolders);

      res.status(200).json(allFolders);
      return;
    }

    // Map the folders to the desired structure and sort them
    const sortedFolders = [rootFolder] // Start with the root folder
      .map((folder) => ({
        ...folder,
        files: folder.files.sort((a, b) => a.name.localeCompare(b.name)) ?? [],
        children: folder.children
          .map((child) => ({
            ...child,
            files:
              child.files.sort((a, b) => a.name.localeCompare(b.name)) ?? [],
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Sort the files and children of each folder
    sortedFolders.forEach(sortFolders);

    logger.info("Folders fetched successfully", req.ip);
    res.status(200).json(sortedFolders);
  } catch (error: any) {
    logger.error(`Error fetching folders: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error fetching folders" });
  }
};

export const updateFolder = async (
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
      logger.warn("New folder name missing", req.ip);
      res.status(400).json({ message: "New folder name is required" });
      return;
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: id },
      data: { name: name },
    });

    logger.info("Folder updated successfully", req.ip);
    res.status(200).json(updatedFolder);
  } catch (error: any) {
    logger.error(`Error updating folder: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error updating folder" });
  }
};

export const deleteFolder = async (
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

    await prisma.folder.delete({
      where: { id: id },
    });

    logger.info("Folder deleted successfully", req.ip);
    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (error: any) {
    logger.error(`Error deleting folder: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error deleting folder" });
  }
};
