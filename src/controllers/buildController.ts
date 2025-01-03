import { Request, Response } from "express";
import logger from "../utils/logger";
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);
const TEMP_DIR = path.join("C:", "Users", "yyili", "Desktop", "CodeCraftDev", "server", "temp");

export const build = async (req: Request, res: Response): Promise<void> => {
  try {
    const { executionType, executionFiles, runType, language } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      logger.warn("User ID not found in request", req.ip);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!executionType || !executionFiles || !runType || !language) {
      logger.warn("Missing parameters", req.ip);
      res.status(400).json({
        message:
          "Missing parameters: executionType, executionFiles, runType, and language are required",
      });
      return;
    }

    if (executionType === "one_file" && runType === "console_app") {
        try {
          const file = executionFiles[0];
          const fileExtension = path.extname(file.name);
          const randomFileName = crypto.randomBytes(16).toString('hex') + fileExtension;
          const filePath = path.join(TEMP_DIR, randomFileName);
          const jsFilePath = filePath.replace(".ts", ".js");
    
          // Dosyayı geçici dizine yaz
          await fs.writeFile(filePath, file.content);
    
          let result;
          let stderr = "";
          if (language === "javascript") {
            // JavaScript kodu çalıştırma
            const { stdout, stderr: err } = await execAsync(`node ${filePath}`);
            result = stdout;
            stderr = err;
          } else if (language === "python") {
            // Python kodu çalıştırma
            const { stdout, stderr: err } = await execAsync(`python ${filePath}`);
            result = stdout;
            stderr = err;
          } else if (language === "typescript") {
              // TypeScript kodu çalıştırma
              try {
                await execAsync(`tsc ${filePath}`);
                const { stdout, stderr: err } = await execAsync(`node ${jsFilePath}`);
                result = stdout;
                stderr = err;
              } catch (error: any) {
                  stderr = error.message;
              }
          }
           else {
            res.status(400).json({ message: "Unsupported language" });
            return;
          }
    
          // Geçici dosyaları sil
          await fs.unlink(filePath);
          if (language === "typescript") {
            try {
              await fs.access(jsFilePath);
              await fs.unlink(jsFilePath);
            } catch (e) {
              // Dosya yoksa sorun değil, silme işlemini atla
            }
          }
          
          if (stderr) {
            logger.error(`Error executing code: ${stderr}`, req.ip);
            res.status(500).json({ message: "Error executing code", error: stderr });
            return
          }
    
          logger.info("Successfully executed code", req.ip);
          res.status(200).json({ result });
        } catch (error: any) {
          logger.error(`Error executing code: ${error.message}`, req.ip);
          res.status(500).json({ message: "Error executing code", error: error.message });
        }
      } else {
        res.status(400).json({ message: "Invalid executionType or runType" });
      }
  } catch (error: any) {
    logger.error(`Error in build: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error in build" });
  }
};
