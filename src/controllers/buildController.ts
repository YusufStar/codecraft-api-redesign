import { Request, Response } from "express";
import logger from "../utils/logger";
import fetch from "node-fetch";

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

    const apiGatewayUrl =
      "https://5g6jb7jtj1.execute-api.us-east-1.amazonaws.com/code-runner";

    const response = await fetch(apiGatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        executionType,
        executionFiles,
        runType,
        language,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error(`Error calling API Gateway: ${data.message}`, req.ip);
      res
        .status(500)
        .json({ message: "Error calling API Gateway", error: data.message });
      return;
    }

    logger.info("Successfully called API Gateway", req.ip);
    res.status(200).json({ result: data.result });
  } catch (error: any) {
    logger.error(`Error in build: ${error.message}`, req.ip);
    res.status(500).json({ message: "Error in build" });
  }
};
