const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fix() {
  console.log("Fixing passwords...");
  const users = await prisma.user.findMany();
  let count = 0;
  const hash = await bcrypt.hash('password123', 10);
  
  for (const u of users) {
    if (!u.password || u.password === '' || u.password.length < 20) {
      await prisma.user.update({
        where: { id: u.id },
        data: { password: hash }
      });
      count++;
    }
  }
  console.log('Fixed passwords for ' + count + ' users.');
}

fix().finally(() => prisma.$disconnect());
