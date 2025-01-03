import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import logger from "../utils/logger";
import path from "path";
import { Request, Response } from "express";
import fs from "fs/promises";
import { spawn } from "child_process";

const execPromise = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
};

const prisma = new PrismaClient();

const generateUniquePort = () => {
  let port;
  while (true) {
    const min = 3000;
    const max = 9999;
    port = Math.floor(Math.random() * (max - min + 1) + min);
    if (port !== 3000 && port !== 5000) {
      break;
    }
  }
  return port;
};

const runningProjects: { [projectId: string]: { process: any } } = {};

export const creteApp = async (req: Request, res: Response): Promise<void> => {
  // Create a react app with execPromise and create a model
  // in the database with prisma
  try {
    const { name } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!name) {
      logger.warn("App name missing", req.ip);
      res.status(400).json({ message: "App name is required" });
      return;
    }

    const existingApp = await prisma.reactProjects.findFirst({
      where: {
        userId,
        name,
      },
    });

    if (existingApp) {
      logger.warn("App already exists", req.ip);
      res.status(400).json({ message: "App already exists" });
      return;
    }

    const appPath = path.join(__dirname, "../../storage", userId, name);
    const port = generateUniquePort();

    await execPromise(`npx create-react-app ${appPath}`);

    const newApp = await prisma.reactProjects.create({
      data: {
        name,
        userId,
        realPath: appPath,
        port,
      },
    });

    logger.info(`App created: ${name}`, req.ip);
    res.status(201).json(newApp);
  } catch (error: any) {
    logger.error(`Error creating app: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error creating app" });
  }
};

export const getAllProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const projects = await prisma.reactProjects.findMany({
      where: {
        userId,
      },
    });

    res.status(200).json(projects);
  } catch (error: any) {
    logger.error(`Error getting all projects: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error getting all projects" });
  }
};

export const getDependency = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      logger.warn("Project ID missing", req.ip);
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    const project = await prisma.reactProjects.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      logger.warn("Project not found", req.ip);
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const appPath = project.realPath;

    const packageJsonPath = path.join(appPath, "package.json");

    const packageJson = await fs.readFile(packageJsonPath, "utf-8");

    const dependencies = JSON.parse(packageJson).dependencies;

    res.status(200).json(dependencies);
  } catch (error: any) {
    logger.error(`Error getting dependencies: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error getting dependencies" });
  }
};

export const addDependency = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { dependency } = req.body;

    if (!dependency) {
      res.status(400).send({ message: "Dependency is required" });
      return;
    }

    const project = await prisma.reactProjects.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      res.status(404).send({ message: "Project not found" });
      return;
    }

    execPromise(`cd ${project.realPath} && yarn add ${dependency}`);

    res.status(200).send({ message: "Dependency added successfully" });
  } catch (error) {
    console.error("Failed to add dependency:", error);
    res.status(500).send({ message: "Failed to add dependency" });
  }
};

export const removeDependency = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { dependency } = req.body;

    if (!projectId) {
      logger.warn("Project ID missing", req.ip);
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    if (!dependency) {
      logger.warn("Dependency missing", req.ip);
      res.status(400).json({ message: "Dependency is required" });
      return;
    }

    const project = await prisma.reactProjects.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      logger.warn("Project not found", req.ip);
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const appPath = project.realPath;

    await execPromise(`cd ${appPath} && yarn remove ${dependency}`);

    res.status(200).json({ message: "Dependency removed successfully" });
  } catch (error: any) {
    logger.error(`Error removing dependency: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error removing dependency" });
  }
};

export const runProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      logger.warn("Project ID missing", req.ip);
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    const project = await prisma.reactProjects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      logger.warn("Project not found", req.ip);
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (runningProjects[projectId]) {
      logger.warn("Project already running", req.ip);
      res.status(200).json({ message: "Project already running" });
      return;
    }

    const appPath = project.realPath;
    const port = project.port;

    console.log(appPath);

    const childProcess = spawn(`yarn cross-env PORT=${port} yarn start`, {
      cwd: appPath,
      shell: true,
      env: process.env,
    });

    childProcess.stdout.on("data", (data) => {
      logger.info(`Project ${projectId} output: ${data}`);
    });

    childProcess.stderr.on("data", (data) => {
      logger.error(`Project ${projectId} error: ${data}`);
    });

    childProcess.on("close", (code) => {
      logger.info(`Project ${projectId} stopped with code ${code}`);
      delete runningProjects[projectId];
    });

    runningProjects[projectId] = { process: childProcess };

    logger.info(`Project started on port ${port}`, req.ip);
    res.status(200).json({ message: `Project started on port ${port}`, port });
  } catch (error: any) {
    logger.error(`Error running project: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error running project" });
  }
};

const getAllFiles = async (
  dir: string,
  req: Request
): Promise<{ filename: string; content: string }[]> => {
  const files: { filename: string; content: string }[] = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    if (
      item.name === "node_modules" ||
      item.name === "build" ||
      item.name === "yarn.lock" ||
      item.name === "public" ||
      item.name.includes(".png") ||
      item.name.includes(".ico") ||
      item.name.startsWith(".")
    ) {
      continue;
    }

    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, req);
      files.push(...subFiles);
    } else {
      const content = await fs.readFile(fullPath, "utf-8");
      files.push({
        filename: fullPath
          .replace(path.join(__dirname, "../../storage"), "")
          .replace(/\\/g, "/"),
        content,
      });
    }
  }
  return files;
};

export const getProjectFiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      logger.warn("Project ID missing", req.ip);
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    const project = await prisma.reactProjects.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      logger.warn("Project not found", req.ip);
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const appPath = project.realPath;
    const files = await getAllFiles(appPath, req);

    const folderStructure = createFolderStructure(files);

    res.status(200).json(Object.values(folderStructure));
  } catch (error: any) {
    logger.error(
      `Error getting project files: ${error.message}`,
      (req as any).ip
    );
    res.status(500).json({ message: "Error getting project files" });
  }
};

function createFolderStructure(
  files: { filename: string; content: string }[]
): { [key: string]: any } {
  const root: { [key: string]: any } = {};

  for (const file of files) {
    const pathParts = file.filename.split("/").filter(Boolean);
    let current = root;
    let currentPath = "";

    for (let i = 1; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      currentPath += `/${part}`;
      if (!current[part]) {
        current[part] = {
          isFolder: true,
          children: {},
          id: currentPath,
          name: part,
          type: "folder",
        };
      }
      current = current[part].children;
    }

    const fileName = pathParts[pathParts.length - 1];
    current[fileName] = {
      ...file,
      isFile: true,
      id: file.filename,
      name: fileName,
      type: "file",
    };
  }

  return root;
}

export const updateFileName = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { oldFilename, newFilename } = req.body;

    if (!projectId) {
      logger.warn("Project ID missing", req.ip);
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    if (!oldFilename || !newFilename) {
      logger.warn("Old or new filename missing", req.ip);
      res.status(400).json({ message: "Old and new filenames are required" });
      return;
    }

    const project = await prisma.reactProjects.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      logger.warn("Project not found", req.ip);
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const oldPath = path.join(__dirname, "../../storage", oldFilename);
    const newPath = path.join(__dirname, "../../storage", newFilename);

    await fs.rename(oldPath, newPath);

    res.status(200).json({ message: "File name updated successfully" });
  } catch (error: any) {
    logger.error(`Error updating file name: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error updating file name" });
  }
};

export const updateFileContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { filename, content } = req.body;

    if (!projectId) {
      logger.warn("Project ID missing", req.ip);
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    if (!filename || content === undefined) {
      logger.warn("Filename or content missing", req.ip);
      res.status(400).json({ message: "Filename and content are required" });
      return;
    }

    const project = await prisma.reactProjects.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      logger.warn("Project not found", req.ip);
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const filePath = path.join(__dirname, "../../storage", filename);

    await fs.writeFile(filePath, content, "utf-8");

    res.status(200).json({ message: "File content updated successfully" });
  } catch (error: any) {
    logger.error(`Error updating file content: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error updating file content" });
  }
};

export const updateFolderName = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { oldFilename, newFilename } = req.body;

    if (!projectId) {
      logger.warn("Project ID missing", req.ip);
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    if (!oldFilename || !newFilename) {
      logger.warn("Old or new filename missing", req.ip);
      res.status(400).json({ message: "Old and new filenames are required" });
      return;
    }

    const project = await prisma.reactProjects.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      logger.warn("Project not found", req.ip);
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const oldPath = path.join(__dirname, "../../storage", oldFilename);
    const newPath = path.join(__dirname, "../../storage", newFilename);

    await fs.rename(oldPath, newPath);

    res.status(200).json({ message: "Folder name updated successfully" });
  } catch (error: any) {
    logger.error(`Error updating folder name: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error updating folder name" });
  }
};

export const deleteFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { filename } = req.body;

    if (!projectId) {
      logger.warn("Project ID missing", req.ip);
      res.status(400).json({ message: "Project ID is required" });
      return;
    }

    if (!filename) {
      logger.warn("Filename missing", req.ip);
      res.status(400).json({ message: "Filename is required" });
      return;
    }

    const project = await prisma.reactProjects.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      logger.warn("Project not found", req.ip);
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const filePath = path.join(__dirname, "../../storage", filename);

    await fs.unlink(filePath);

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error: any) {
    logger.error(`Error deleting file: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error deleting file" });
  }
};

export default {
  getProjects: getAllProjects,
  createProject: creteApp,
  getProject: getProjectFiles,
  getDependencies: getDependency,
  removeDependency: removeDependency,
  addDependency: addDependency,
  updateFileName: updateFileName,
  updateFileContent: updateFileContent,
  updateFolderName: updateFolderName,
  deleteFile: deleteFile,
};
