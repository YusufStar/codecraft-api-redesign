import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import logger from "../utils/logger";
import path from "path";
import { Request, Response } from "express";
import fs from "fs/promises";

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
        AND: [{ userId: userId }, { name: name }],
      },
    });

    if (existingApp) {
      logger.warn("App already exists", (req as any).ip);
      res.status(400).json({ message: "App already exists" });
      return;
    }

    const appPath = path.join(__dirname, "../../storage", userId, name);

    await execPromise(`yarn create react-app ${appPath}`);

    const newApp = await prisma.reactProjects.create({
      data: {
        name: name,
        userId: userId,
        realPath: appPath,
        port: generateUniquePort(),
      },
    });

    logger.info("App created successfully", (req as any).ip);
    res.status(201).json(newApp);
  } catch (error: any) {
    logger.error(`Error creating app: ${error.message}`, (req as any).ip);
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
        userId: userId,
      },
    });

    res.status(200).json(projects);
  } catch (error: any) {
    logger.error(
      `Error getting all projects: ${error.message}`,
      (req as any).ip
    );
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

    const packageJsonPath = path.join(project.realPath, "package.json");

    const packageJson = await fs.readFile(packageJsonPath, "utf-8");
    const dependencies = JSON.parse(packageJson).dependencies;

    res.status(200).json(dependencies);
  } catch (error: any) {
    logger.error(
      `Error getting dependencies: ${error.message}`,
      (req as any).ip
    );
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

    await execPromise(`cd ${appPath} && yarn add ${dependency}`);

    res.status(200).json({ message: "Dependency added successfully" });
  } catch (error: any) {
    logger.error(`Error adding dependency: ${error.message}`, (req as any).ip);
    res.status(500).json({ message: "Error adding dependency" });
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
    logger.error(
      `Error removing dependency: ${error.message}`,
      (req as any).ip
    );
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
      where: {
        id: projectId,
      },
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

    const childProcess = exec(`cd ${appPath} && yarn start --port ${port}`);

    runningProjects[projectId] = { process: childProcess };

    childProcess.on("error", (error: any) => {
      logger.error(`Error running project: ${error.message}`, (req as any).ip);
      delete runningProjects[projectId];
    });

    childProcess.on("close", (code: any) => {
      logger.info(`Project stopped with code ${code}`, (req as any).ip);
      delete runningProjects[projectId];
    });

    logger.info(`Project started on port ${port}`, (req as any).ip);
    res.status(200).json({ message: `Project started on port ${port}` });
  } catch (error: any) {
    logger.error(`Error running project: ${error.message}`, (req as any).ip);
    res.status(500).json({ message: "Error running project" });
  }
};

const getAllFiles = async (dir: string): Promise<{ filename: string; content: string }[]> => {
  const files: { filename: string; content: string }[] = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.name === "node_modules" || item.name === "build" || item.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      files.push(...subFiles);
    } else {
      const content = await fs.readFile(fullPath, "utf-8");
      files.push({ filename: fullPath.replace(path.join(__dirname, "../../storage"), "").replace(/\\/g, "/"), content });
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
    const files = await getAllFiles(appPath);

    res.status(200).json(files);
  } catch (error: any) {
    logger.error(`Error getting project files: ${error.message}`, (req as any).ip);
    res.status(500).json({ message: "Error getting project files" });
  }
};
