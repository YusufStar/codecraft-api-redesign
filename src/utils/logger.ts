import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

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

winston.addColors(logLevels.colors);

class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      levels: logLevels.levels,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new DailyRotateFile({
          filename: "logs/%DATE%-combined.log",
          datePattern: "YYYY-MM-DD",
          level: "info",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format.printf(({ level, message, timestamp }) => {
              return `${timestamp} ${level}: ${message}`;
            })
          ),
          maxFiles: "14d",
        }),
        new DailyRotateFile({
          filename: "logs/%DATE%-error.log",
          datePattern: "YYYY-MM-DD",
          level: "error",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format.printf(({ level, message, timestamp }) => {
              return `${timestamp} ${level}: ${message}`;
            })
          ),
          maxFiles: "14d",
        }),
      ],
    });
  }

  public info(message: string, ip?: string | undefined | string[]): void {
    this.logger.info(this.formatLogMessage(message, ip));
  }

  public warn(message: string, ip?: string | undefined | string[]): void {
    this.logger.warn(this.formatLogMessage(message, ip));
  }

  public error(message: string, ip?: string | undefined | string[]): void {
    this.logger.error(this.formatLogMessage(message, ip));
  }

  public debug(message: string, ip?: string | undefined | string[]): void {
    this.logger.debug(this.formatLogMessage(message, ip));
  }

  private formatLogMessage(
    message: string,
    ip?: string | undefined | string[]
  ): string {
    if (ip) {
      return `${message} - IP: ${ip}`;
    }
    return message;
  }
}

const logger = new Logger();
export default logger;
