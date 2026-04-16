import { Router } from "express";
import fetchemails from "../services/gmail.js";

const router_for_mail = Router();

router_for_mail.get('/', async (req, res) => {
    let results = await fetchemails();
    res.json({success: true, snippet: results});
})

export default router_for_mail;