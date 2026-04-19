import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../db.js";

const router_db = Router();

router_db.get('/', async (req:Request, res: Response) => {
    try {
        const applications = await prisma.application.findMany({
            orderBy: {
                updatedAt: 'desc'
            }
        });

        res.json({
            success: true,
            count: applications.length,
            data: applications
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            error: "Failed to fetch applications"
        });
    }
    
});
export default router_db;
