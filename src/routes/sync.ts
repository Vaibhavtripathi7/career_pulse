import { Router } from "express";
import fetchemails from "../services/gmail.js";
import requiresauth from "../middlewares/auth.js";
import type { Request, Response } from "express";

const router_for_mail = Router();

router_for_mail.post('/', requiresauth,  async (req: Request, res: Response) => {
    try {
        const id = (req as any).userId;
        const results = await fetchemails(id);
        res.json({success: true, snippet: results,
            count: results.length 
        });

    } catch (error) {
        console.error("sync error", error);
        res.status(500).send("failed to sync emails")
    }
    
});

export default router_for_mail;