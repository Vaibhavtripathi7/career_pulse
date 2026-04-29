import cron from 'node-cron'; 
import type { ScheduledTask } from 'node-cron';
import fetchemails from '../services/gmail.js';
import { getAllUsers } from '../services/user.js'; 

class EmailCronService {
    private isRunning: boolean = false;
    private cronJob: ScheduledTask | null = null;

    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY_MS = 5000;
    private readonly TIMEOUT_MS = 10 * 60 * 1000; 


    public start(): void {
        console.log(this.log('INIT', 'Starting email sync cron (Every 1 hour)'));

        this.cronJob = cron.schedule(
            '0 */2 * * *',
            async () => {
                await this.executeSync();
            },
            {
                timezone: 'Asia/Kolkata',
            }
        );

        this.setupGracefulShutdown();
    }


    private async executeSync(): Promise<void> {
        if (this.isRunning) {
            console.warn(this.log('SKIP', 'Previous run still active, skipping'));
            return;
        }

        this.isRunning = true;
        console.log(this.log('START', 'Email sync started'));

        try {
            await this.runWithRetry();
            console.log(this.log('SUCCESS', 'Email sync completed'));
        } catch (error) {
            console.error(this.log('ERROR', 'Email sync failed', error));
        } finally {
            this.isRunning = false;
        }
    }


    private async runWithRetry(): Promise<void> {
        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                await this.withTimeout(this.processAllUsers(), this.TIMEOUT_MS);
                return;
            } catch (error) {
                console.error(this.log('RETRY', `Attempt ${attempt} failed`, error));

                if (attempt === this.MAX_RETRIES) {
                    throw error;
                }

                await this.sleep(this.RETRY_DELAY_MS * attempt);
            }
        }
    }

    private async processAllUsers(): Promise<void> {
        const users = await getAllUsers();

        if (!users.length) {
            console.warn(this.log('INFO', 'No users found'));
            return;
        }

        console.log(this.log('INFO', `Processing ${users.length} users`));

        for (const user of users) {
            try {
                await fetchemails(user.id);

                console.log(this.log(
                    'USER_SUCCESS',
                    `Synced emails for user ${user.id}`
                ));

                await this.sleep(1000);

            } catch (error) {
                console.error(this.log(
                    'USER_ERROR',
                    `Failed for user ${user.id}`,
                    error
                ));

            }
        }
    }


    private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), ms)
            ),
        ]);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((res) => setTimeout(res, ms));
    }


    private log(status: string, message: string, error?: any): string {
        return JSON.stringify({
            service: 'EmailCronService',
            status,
            message,
            error: error ? (error.message || error) : undefined,
            time: new Date().toISOString(),
        });
    }


    private setupGracefulShutdown(): void {
        const shutdown = () => {
            console.log(this.log('SHUTDOWN', 'Stopping cron service'));
            this.stop();
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }

    public stop(): void {
        if (this.cronJob) {
            this.cronJob.stop();
            console.log(this.log('STOP', 'Cron stopped'));
        }
    }
}

export const emailCronService = new EmailCronService();