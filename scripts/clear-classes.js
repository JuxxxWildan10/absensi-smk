const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.classRoom.deleteMany();
  console.log('Semua kelas berhasil dihapus. Refresh halaman (API GET) akan me-restore default.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
