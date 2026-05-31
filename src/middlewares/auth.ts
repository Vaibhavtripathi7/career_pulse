import type {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

function requiresauth(req:Request, res:Response, nextfunction:NextFunction){
    const token = req.cookies.careerpulse_auth;
    if(!token){
        return res.status(401).json({
            error: "Unauthorized"
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).userId = (decoded as any).userId;

        nextfunction();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized: invalid token"})
    }

};

export default requiresauth;