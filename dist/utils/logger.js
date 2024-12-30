"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const logLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
    },
    colors: {
        error: "red",
        warn: "yellow",
        info: "green",
        debug: "blue",
    },
};
winston_1.default.addColors(logLevels.colors);
class Logger {
    constructor() {
        this.logger = winston_1.default.createLogger({
            levels: logLevels.levels,
            transports: [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
                }),
                new winston_daily_rotate_file_1.default({
                    filename: "logs/%DATE%-combined.log",
                    datePattern: "YYYY-MM-DD",
                    level: "info",
                    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json(), winston_1.default.format.printf(({ level, message, timestamp }) => {
                        return `${timestamp} ${level}: ${message}`;
                    })),
                    maxFiles: "14d",
                }),
                new winston_daily_rotate_file_1.default({
                    filename: "logs/%DATE%-error.log",
                    datePattern: "YYYY-MM-DD",
                    level: "error",
                    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json(), winston_1.default.format.printf(({ level, message, timestamp }) => {
                        return `${timestamp} ${level}: ${message}`;
                    })),
                    maxFiles: "14d",
                }),
            ],
        });
    }
    info(message, ip) {
        this.logger.info(this.formatLogMessage(message, ip));
    }
    warn(message, ip) {
        this.logger.warn(this.formatLogMessage(message, ip));
    }
    error(message, ip) {
        this.logger.error(this.formatLogMessage(message, ip));
    }
    debug(message, ip) {
        this.logger.debug(this.formatLogMessage(message, ip));
    }
    formatLogMessage(message, ip) {
        if (ip) {
            return `${message} - IP: ${ip}`;
        }
        return message;
    }
}
const logger = new Logger();
exports.default = logger;
