import { Router} from 'express';
import type { Request, Response } from 'express';
import prisma from '../db.js';
import oauth2client from '../utils/googleclient.js';
import { google } from 'googleapis';
const  authrouter = Router();

const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly"    
];

authrouter.get('/google', (req: Request, res: Response)=> {
    const url = oauth2client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
    });
    res.redirect(url);
});

authrouter.get('/google/callback', async (req: Request, res:Response)=> {

    const code = req.query.code as string;

    if (!code){
        return res.status(400).send("No code provided by google");
    }
    try {
        const { tokens } = await oauth2client.getToken(code);
        oauth2client.setCredentials(tokens);

        const oauth2 = google.oauth2({ auth: oauth2client, version: 'v2'});
        const { data } = await oauth2.userinfo.get();
        if (!data.email){
            return res.status(400).send("No email provided by google");

        }
        const user = await prisma.user.upsert({
            where: {email: data.email},
            update: {
                name: data.name ?? null,
                googleId: data.id ?? null,
                accessToken: tokens.access_token ?? null,
                ...(tokens.refresh_token && { refreshToken: tokens.refresh_token})
            },

            create: {
                email: data.email ,
                name: data.name ?? null,
                googleId: data.id ?? null,
                accessToken: tokens.access_token ?? null,
                refreshToken: tokens.refresh_token ?? null 
            } 
        });
    

        console.log("success", tokens);
        res.send("Authentication successful!")
        
    } catch (error) {
        console.error("Failed to get tokens", error);
        res.status(500).send("authentication error");
        
    }
});

export default authrouter;






