import {google} from 'googleapis'
import 'dotenv/config';
import prisma from '../db.js';
import { emailPipeline } from '../pipeline/email.pipeline.js';

async function fetchemails(userId: string){

    const user = await prisma.user.findUnique({

        where: {id: userId},
        select: { refreshToken: true, accessToken: true}
    });

    if (!user || !user.refreshToken) {
        throw new Error("USer not found");
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

    let mail = await gmail.users.messages.list({userId: 'me', maxResults: 10, q: "subject:application"})
    const message = mail.data.messages;
    if (!message || message.length === 0) {
        return [];
    } 

    const mail_application = [];

    for (const msg of message) {
        if (!msg.id) continue;

        let main_content = await gmail.users.messages.get({userId: 'me' ,id: msg.id});
        let list_of_objects = main_content.data.payload?.headers;

        const subject_value = list_of_objects?.find(header => header.name === 'Subject')?.value;
        const formValue = list_of_objects?.find(headers => headers.name === 'From')?.value;    

        const parsed = await emailPipeline({
            subject: subject_value as string,
            sender: formValue as string
        });
        if (subject_value && formValue) {
            const extractData = {
                subject: subject_value as string,
                messageId: msg.id, 
                sender: formValue as string,

                companyName: parsed.companyName as string,
                role: parsed.role as string,
                
                status: "Applied",
                workModel: parsed.workModel as string,
                userID: userId
            };
            mail_application.push(extractData); 
        }
    }

    if (mail_application.length > 0){
        await prisma.application.createMany({
            data: mail_application,
            skipDuplicates: true 
        });
    }    
    return mail_application;
    
}   


export default fetchemails;