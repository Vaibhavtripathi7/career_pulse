import prisma from "../db.js";

export async function getAllUsers() {
    return prisma.user.findMany({

        select: {
            id: true
        }
    });
}