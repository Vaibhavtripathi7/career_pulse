import {google} from 'googleapis'
import 'dotenv/config';
import prisma from '../db.js';
import { emailPipeline } from '../pipeline/email.pipeline.js';
import pLimit from 'p-limit';
import type { Application, Prisma } from '@prisma/client';
import { logger } from "../utils/logger.js";
import { increment } from '../utils/metrices.js';

const limit = pLimit(2);
async function fetchemails(userId: string): Promise<Prisma.ApplicationCreateManyInput[]>{

    logger.info({userId}, "Fetching emails");
    const user = await prisma.user.findUnique({

        where: {id: userId},
        select: { refreshToken: true, accessToken: true, lastSyncAt: true}
    });

    if (!user || !user.refreshToken) {
        throw new Error("User not found");
    }


    const oauth2client = new google.auth.OAuth2(
        process.env.CLIENT_ID as string,
        process.env.CLIENT_SECRET as string

    )
    oauth2client.setCredentials({
        refresh_token: user.refreshToken,
        access_token: user.accessToken
    });
    const gmail = google.gmail({ version: 'v1', auth: oauth2client});

    const gmailQuery = user.lastSyncAt
    ? `(application OR interview OR job OR hiring OR position) after:${Math.floor(user.lastSyncAt.getTime() / 1000)} -newsletter`
    : `(application OR interview OR job OR hiring OR position) newer_than:30d -newsletter`;

    let mail = await gmail.users.messages.list({userId: 'me', maxResults: 50, q: gmailQuery})
    const message = mail.data.messages;

    if (!message || message.length === 0) {

        logger.info(
            { userId },
            "No new emails found"
        );

        await prisma.user.update({
            where: { id: userId },
            data: {
                lastSyncAt: new Date()
            }
        });

        return [];
    }



    const mail_application = await Promise.all(
        message.map((msg) =>
            limit(async () =>  {
                increment("totalEmails")

                try {
                    if (!msg.id) return null;
                    const main_content = await gmail.users.messages.get({userId: 'me' ,id: msg.id});
                    const list_of_objects = main_content.data.payload?.headers;

                    const subject_value = list_of_objects?.find(header => header.name === 'Subject')?.value;
                    const formValue = list_of_objects?.find(headers => headers.name === 'From')?.value;    
                    
                    const snippet_value = main_content.data.snippet;
                    if (!subject_value || !formValue) return null;

                    const parsed = await emailPipeline({
                        subject: subject_value as string,
                        sender: formValue as string,
                        snippet: snippet_value as string
                        });


                    const rawDate = main_content.data.internalDate;
                    const headerDate = list_of_objects?.find(h=> h.name === 'Date')?.value;
        
                    const finalDate = headerDate
                        ? new Date(headerDate)
                        : rawDate
                        ? new Date(Number(rawDate))
                        : null;
                    
                    increment("success");
                    return {

                        subject: subject_value,
                        messageId: msg.id,
                        sender: formValue as string,

                        companyName: parsed.companyName as string,
                        role: parsed.role as string,
                        workModel: parsed.workModel as string,
                        status: "Applied",
                        userID: userId,
                        dateApplied: finalDate ?? new Date() 
                    };
                } catch (error) {
                    increment("failed");
                    logger.error({ msgId: msg.id, error},"email processing failed:");
                    return null;
                }
            })
        )
    );
    const filtered = mail_application.filter(
        (item): item is NonNullable<typeof item> => item !== null
    );

    if (filtered.length > 0) {
        await prisma.application.createMany({
            data: filtered,
            skipDuplicates: true
        });
    }
    logger.info({count: filtered.length}, "Email processed");

    await prisma.user.update({
        where: { id: userId },
        data: {
        lastSyncAt: new Date()
    }
    });
    return filtered; 
} 
export default fetchemails;