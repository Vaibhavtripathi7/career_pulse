import { z } from "zod";

export const createApplicationSchema = z.object({

    companyName: z.string().trim().min(1, "Company name is required"),
    role: z.string().trim().min(1,"Role is required"),
    subject: z.string().optional(),
    status: z.enum([
        "applied",
        "interviewing",
        "offer",
        "rejected"
    ]).optional(),

    workModel: z.enum([
        "remote",
        "onsite",
        "hybrid"
    ]).optional()

});

export const updateStatusSchema = z.object({
    status: z.enum([
        "applied",
        "interviewing",
        "offer",
        "rejected"
    ])
});