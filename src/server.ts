import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import logger from "./utils/logger";
import userRoutes from "./routes/userRoutes";
import { authRequire } from "./middleware";
import { config } from "dotenv";
import multer from "multer";
import { Upload } from "@aws-sdk/lib-storage";
import { S3 } from "@aws-sdk/client-s3";
import folderRoutes from "./routes/folderRoutes";
import fileRoutes from "./routes/fileRoutes";
import buildRoutes from "./routes/buildRoutes";
import snippetRoutes from "./routes/snippetRoutes";

config();
const app = express();
const prisma = new PrismaClient();

// Initialize AWS S3
const s3 = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },

  region: process.env.AWS_REGION!,
});

// Set up multer for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post(
  "/upload",
  authRequire,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    let file = req.file;
    if (!file) {
      res.status(400).send("No file uploaded");
      return;
    }

    const { originalname, mimetype, buffer } = file;

    try {
      // Upload the file to S3
      const data = await new Upload({
        client: s3,
        params: {
          Bucket: process.env.AWS_BUCKET_NAME!, // Your S3 Bucket name
          Key: `uploads/${Date.now()}_${originalname}`, // S3 object key (unique name)
          Body: buffer,
          ContentType: mimetype,
        },
      }).done();
      const fileUrl = data.Location;

      res.send({
        fileUrl,
        message: "File uploaded successfully",
      });
    } catch (err: any) {
      logger.error(`Error uploading file to S3: ${err.message}`);
      res.status(500).send("Error uploading file to S3");
    }
  }
);

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["Authorization"],
    maxAge: 600,
    optionsSuccessStatus: 204,
    preflightContinue: false,
  })
);
app.use(
  rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
  })
);
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  logger.info("Received request at /", ip);
  res.send("Hello, world!");
});

app.use("/users", userRoutes);
app.use("/folders", folderRoutes);
app.use("/files", fileRoutes);
app.use("/build", buildRoutes);
app.use("/snippets", snippetRoutes);


app.listen(3000, () => {
  logger.info("HTTP Server running on http://localhost:3000");
});

export default app;
