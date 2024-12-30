"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = __importDefault(require("./utils/logger"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const middleware_1 = require("./middleware");
const dotenv_1 = require("dotenv");
const multer_1 = __importDefault(require("multer"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
// Initialize AWS S3
const s3 = new aws_sdk_1.default.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
// Set up multer for file handling
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
app.post("/upload", middleware_1.authRequire, upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let file = req.file;
    if (!file) {
        res.status(400).send("No file uploaded");
        return;
    }
    const { originalname, mimetype, buffer } = file;
    // Define S3 parameters
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME, // Your S3 Bucket name
        Key: `uploads/${Date.now()}_${originalname}`, // S3 object key (unique name)
        Body: buffer,
        ContentType: mimetype,
        ACL: "public-read", // This will make the file publicly accessible
    };
    try {
        // Upload the file to S3
        const data = yield s3.upload(params).promise();
        const fileUrl = data.Location;
        // Optionally, save file metadata to a database if needed (e.g., MongoDB or PostgreSQL)
        // const newFile = new File({
        //   filename: originalname,
        //   contentType: mimetype,
        //   fileUrl,
        // });
        // await newFile.save();
        res.send({
            fileUrl,
            message: "File uploaded successfully",
        });
    }
    catch (err) {
        logger_1.default.error(`Error uploading file to S3: ${err.message}`);
        res.status(500).send("Error uploading file to S3");
    }
}));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:5000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["Authorization"],
    maxAge: 600,
    optionsSuccessStatus: 204,
    preflightContinue: false,
}));
app.use((0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 100,
}));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    logger_1.default.info("Received request at /", ip);
    res.send("Hello, world!");
});
app.use("/users", userRoutes_1.default);
app.listen(3000, () => {
    logger_1.default.info("HTTP Server running on http://localhost:3000");
});
exports.default = app;
