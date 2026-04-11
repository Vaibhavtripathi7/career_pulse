
import express from 'express';
import type { Response, Request } from 'express';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.json({status: "alive", timestamp: new Date().toISOString()});
})

export default router;