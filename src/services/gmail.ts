import {google} from 'googleapis'
import 'dotenv/config';
import prisma from '../db.js';
import extractCleanData, { extractRole, exractWorkmodel} from '../utils/extractor.js';

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID as string,
    process.env.CLIENT_SECRET as string,
);
oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN as string
});


const gmail = google.gmail({version: 'v1', auth: oauth2Client})

async function fetchemails(){
    let mail = await gmail.users.messages.list({userId: 'me', maxResults: 10, q: "subject:application"})
    const message = mail.data.messages;
    if (!message || message.length === 0) {
        console.log("no new emails")
        return;
    }

    const mail_application = [];

    for (const msg of message) {
        if (!msg.id) continue;

        let main_content = await gmail.users.messages.get({userId: 'me' ,id: msg.id});
        let list_of_objects = main_content.data.payload?.headers;

        const subject_value = list_of_objects?.find(header => header.name === 'Subject')?.value;
        const formValue = list_of_objects?.find(headers => headers.name === 'From')?.value;    

        const cleandata_company = extractCleanData(formValue as string);
        const clean_role = extractRole(subject_value as string);
        const cleanmodel = exractWorkmodel(subject_value as string);
        const extractData = {
            subject: subject_value as string,
            sender: formValue as string,
            companyName: cleandata_company as string,
            role: clean_role,
            status: "Applied",
            workModel: cleanmodel
        };

        if (subject_value && formValue) {
            const cleandata_company = extractCleanData(formValue as string);
            const extractData = {
                subject: subject_value as string,
                sender: formValue as string,
                companyName: cleandata_company as string,
                role: "sde",
                status: "de",
                workModel: ""
            };
            mail_application.push(extractData);
        }
    }

    if (mail_application.length > 0){
        await prisma.application.createMany({
            data: mail_application
        });
    }    
    return mail_application;
    
}   


export default fetchemails;