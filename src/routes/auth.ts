import { Router} from 'express';
import type { Request, Response } from 'express';
import prisma from '../db.js';
import oauth2client from '../utils/googleclient.js';
import { google } from 'googleapis';
const  authrouter = Router();
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import requiresauth from '../middlewares/auth.js';

const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly"    
];

authrouter.get('/google', (req: Request, res: Response)=> {
    const url = oauth2client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
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
        const payload = {
            userId: user.id };
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET as string,
            { expiresIn: '7d'}
        );

        res.cookie('careerpulse_auth', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7*24*60*60*1000
        });
        res.redirect(process.env.FRONTEND_URL as string)
    }
        
    catch (error) {
        console.error("Failed to get tokens", error);
        res.status(500).send("authentication error");
        
    }
});

authrouter.get('/me', requiresauth, async (req: Request, res: Response) => {
    try {
        const id = (req as any).userId;

        const user = await prisma.user.findUnique({
            where: {
                id: id
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });
        if(!user){
            return res.status(404).json({ error: "User not found"});

        }
        res.json(user);
    } catch (error) {
        res.status(500).json({error: "server error"})
    }
})

export default authrouter;






