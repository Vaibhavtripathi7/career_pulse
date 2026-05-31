import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../db.js";
import requiresauth from "../middlewares/auth.js";
import { createApplicationSchema, updateStatusSchema } from "../validators/application.validator.js";

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
    const parsed = createApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.flatten()
      });
    }

    const { subject, companyName, role,status, workModel} = parsed.data;
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
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.flatten()
      });
    }
    const { status } = parsed.data;
    const userId = (req as any).userId;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: "Invalid ID format"});
    }

    const application = await prisma.application.findFirst({
      where: {
        id,
        userID: userId
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found"
      });
    }
    const updated = await prisma.application.update({
      where: { id },
      data: {status} 
    });

    return res.json({
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
