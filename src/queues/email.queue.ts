import { Queue } from "bullmq";


type EmailSyncJob = {
    userId: string;
};
export const emailQueue = new Queue<EmailSyncJob>(
    "email-sync",
    {
        connection: {
            host: process.env.REDIS_HOST || "localhost",
            port: Number(process.env.REDIS_PORT) || 6379,

        },
        defaultJobOptions: {
            attempts: 3,
            removeOnComplete: 100,
            removeOnFail: 50,
            backoff: {
                type: "exponential",
                delay: 5000
            }
        }
    }
);