import {google} from 'googleapis'
import 'dotenv/config';

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID as string,
    process.env.CLIENT_SECRET as string,
);
oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN as string
});


const gmail = google.gmail({version: 'v1', auth: oauth2Client})

async function fetchemails(){
    let mail = await gmail.users.messages.list({userId: 'me', maxResults: 1, q: "subject:application"})
    const message = mail.data.messages;
    if (!message || message.length === 0) {
        console.log("no new emails")
        return;
    }
    const firstmail = message[0]
    if (!firstmail || !firstmail.id ) {
        console.log("email exists")
        return ;
    }

    let main_content = await gmail.users.messages.get({userId: 'me', id: firstmail.id})
    
    let list_of_objects = main_content.data.payload?.headers;
    
    const subject_value = list_of_objects?.find(header => header.name === 'Subject')?.value;
    const formValue = list_of_objects?.find(headers => headers.name === 'From')?.value;    

    const extractData = {
        subject: subject_value,
        sender: formValue
    };

    console.log("Extracted", extractData);
    return extractData;
    
}   

export default fetchemails;