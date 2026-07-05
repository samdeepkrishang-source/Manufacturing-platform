import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Resolve the absolute path of dev.db at the project root
const dbPath = path.resolve(process.cwd(), 'dev.db');

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`
});

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
