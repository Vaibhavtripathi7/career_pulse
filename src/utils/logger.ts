import pino from "pino";

const env = process.env.NODE_ENV;

export const logger = 
    env === "production"
    ? pino()
    : env === "test"
    ? pino({ level: "silent"})
    : pino({

    level: "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true
        }
    }
});