import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const {Pool} = pg;
const connectionString = process.env.DATABASE_URL || "postgresql://vaibhav:supersecret@localhost:5432/careerpulse?schema=public";
const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
