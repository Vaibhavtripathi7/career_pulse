import { Worker } from "bullmq";
import fetchemails from "./services/gmail.js";

type EmailSyncJob = {
  userId: string;
};
export const emailWorker = new Worker<EmailSyncJob>(
    "email-sync",
    async (job) => {
        console.log("Job received", job.data);
        const { userId } = job.data;

        await fetchemails(userId);
    },
    {
        connection: {
            host: process.env.REDIS_HOST || "localhost",
            port: Number(process.env.REDIS_PORT) || 6379,

        },
        concurrency: 2
    }
);