const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Menghubungkan ke database...");
  
  // Hash password baru
  const newPassword = await bcrypt.hash("admin123", 10);
  
  // Update password admin
  await prisma.user.update({
    where: { username: "admin" },
    data: { password: newPassword },
  });
  
  console.log("✅ Password admin berhasil direset menjadi: admin123");
}

main()
  .catch((e) => {
    console.error("Terjadi kesalahan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
