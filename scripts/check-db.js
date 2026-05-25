const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { username: true, role: true }});
  console.log('Users:', users.length);
  const classes = await prisma.classRoom.findMany();
  console.log('Classes:', classes);
}

main().catch(console.error).finally(() => prisma.$disconnect());
