import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../db.js";
import requiresauth from "../middlewares/auth.js";
import { string, success } from "zod";
import { error } from "node:console";

const router_db = Router();

router_db.get('/',requiresauth, async (req:Request, res: Response) => {
    try {
        const id = (req as any).userId;

        const applications = await prisma.application.findMany({

            where: {
                userID: id
            },
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

router_db.post('/', requiresauth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { subject, companyName, role, status, workModel } = req.body;

    const newApp = await prisma.application.create({
      data: {
        subject: subject || "Manual Entry",
        messageId: crypto.randomUUID(),
        sender: "manual",
        companyName,
        role,
        status: status || "Applied",
        workModel: workModel || "Unknown",
        userID: userId
      }
    });

    res.json({
      success: true,
      data: newApp
    });

  } catch (error) {
    console.error("Create application failed:", error);

    res.status(500).json({
      success: false,
      error: "Failed to create application"
    });
  }
});

router_db.patch('/:id', requiresauth, async (req: Request, res: Response) => {

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: "Invalid ID format"});
    }
    const updated = await prisma.application.update({
      where: { id },
      data: {status} 
    });

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    
    console.error("Update failed", error);
    res.status(500).json({
      success: false,
      error: "failed to update!"
    })
  }
})

export default router_db;
