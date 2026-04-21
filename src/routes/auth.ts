import { Router} from 'express';
import type { Request, Response } from 'express';

import oauth2client from '../utils/googleclient.js';


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
        console.log("success", tokens);
        res.send("Authentication successful!")
        
    } catch (error) {
        console.error("Failed to get tokens", error);
        res.status(500).send("authentication error");
        
    }
});

export default authrouter;






