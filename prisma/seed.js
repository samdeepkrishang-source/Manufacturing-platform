const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const crypto = require('crypto');
const path = require('path');

// Resolve the absolute path of the database at the project root
const dbPath = path.resolve(__dirname, '..', 'dev.db');
console.log('Opening database at:', dbPath);

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`
});
const prisma = new PrismaClient({ adapter });

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Starting seeding...');
  
  // Clean up existing data
  await prisma.downtimeEvent.deleteMany({});
  await prisma.productionLog.deleteMany({});
  await prisma.shiftHandover.deleteMany({});
  await prisma.shiftRun.deleteMany({});
  await prisma.machine.deleteMany({});
  await prisma.user.deleteMany({});

  // Create default supervisor user
  const user = await prisma.user.create({
    data: {
      email: 'david@factory.com',
      passwordHash: hashPassword('password123'),
      firstName: 'David',
      lastName: 'Supervisor',
      companyName: 'Apex Manufacturing Solutions',
    }
  });
  console.log('Seeded default supervisor user:', user.email);

  // Create default machines
  const machines = [
    { name: 'Filler-01' },
    { name: 'Labeler-02' },
    { name: 'Packer-03' }
  ];

  for (const m of machines) {
    const created = await prisma.machine.create({ data: m });
    console.log('Seeded machine:', created.name);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
