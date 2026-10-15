import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const {Pool} = pg;
const connectionString = process.env.DATABASE_URL;
const isProd = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString,
  ssl: isProd
    ? { rejectUnauthorized: false }
    : false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
