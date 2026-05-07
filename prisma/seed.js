// ============================================================
// AbsensiCerdas - Database Seed Script
// Jalankan dengan: npx ts-node prisma/seed.ts
// Atau: node prisma/seed.js (setelah dikompilasi)
// ============================================================

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();

async function hash(plain) {
  return bcrypt.hash(plain, 10);
}

async function main() {
  console.log("🌱 Memulai Seed Database AbsensiCerdas...\n");

  // ── 1. School Config ─────────────────────────────────────
  await prisma.schoolConfig.upsert({
    where:  { id: "school-1" },
    update: {},
    create: {
      id:           "school-1",
      name:         "SMK ARYA SINGASARI LARANGAN",
      address:      "Jl. Pendidikan No. 1, Kota Contoh", // Bisa disesuaikan nanti
      latitude:     -6.9597244,
      longitude:    108.9829353,
      radius:       100,
      checkInStart: "06:30",
      checkInEnd:   "07:30",
      checkOutStart:"14:00",
      checkOutEnd:  "16:00",
    },
  });
  console.log("✅ School config selesai.");

  // ── 2. Admin ─────────────────────────────────────────────
  const adminPass = await hash("admin123");
  await prisma.user.upsert({
    where:  { username: "admin" },
    update: {},
    create: {
      id:       uuidv4(),
      name:     "Administrator",
      username: "admin",
      password: adminPass,
      role:     "admin",
      isActive: true,
    },
  });
  console.log("✅ Admin selesai.");

  // ── 3. Guru ──────────────────────────────────────────────
  const guruPass = await hash("guru123");
  const guru1 = await prisma.user.upsert({
    where:  { username: "guru.budi" },
    update: {},
    create: {
      id:           uuidv4(),
      name:         "Budi Santoso, S.Pd",
      username:     "guru.budi",
      password:     guruPass,
      role:         "guru",
      nip:          "198501012010011001",
      mataPelajaran: JSON.stringify(["Desain Grafis", "Multimedia"]),
      kelasWali:    "X DKV 1",
      isActive:     true,
    },
  });

  const guru2 = await prisma.user.upsert({
    where:  { username: "guru.sari" },
    update: {},
    create: {
      id:           uuidv4(),
      name:         "Sari Dewi, S.T",
      username:     "guru.sari",
      password:     guruPass,
      role:         "guru",
      nip:          "199001012015012002",
      mataPelajaran: JSON.stringify(["Teknik Sepeda Motor", "Sistem Bahan Bakar"]),
      kelasWali:    "X TSM 1",
      isActive:     true,
    },
  });
  console.log("✅ Guru selesai.");

  // ── 4. Wali Murid ─────────────────────────────────────────
  const waliPass = await hash("wali123");
  const wali1 = await prisma.user.upsert({
    where:  { username: "wali.andi" },
    update: {},
    create: {
      id:       uuidv4(),
      name:     "Andika Pratama",
      username: "wali.andi",
      password: waliPass,
      role:     "wali",
      phone:    "08123456789",
      isActive: true,
      studentIds: JSON.stringify([]), // akan diisi setelah siswa dibuat
    },
  });
  console.log("✅ Wali murid selesai.");

  // ── 5. Siswa DKV ─────────────────────────────────────────
  const siswaPass = await hash("siswa123");
  const dkvStudents = [
    { name: "Rizky Aditya",     nisn: "0001234001", username: "rizky.dkv1",   kelas: "X DKV 1" },
    { name: "Sinta Rahayu",     nisn: "0001234002", username: "sinta.dkv1",   kelas: "X DKV 1" },
    { name: "Bagas Prasetyo",   nisn: "0001234003", username: "bagas.dkv1",   kelas: "X DKV 1" },
    { name: "Dinda Ayu",        nisn: "0001234004", username: "dinda.dkv1",   kelas: "X DKV 1" },
    { name: "Evan Surya",       nisn: "0001234005", username: "evan.dkv1",    kelas: "XI DKV 1" },
    { name: "Farah Nabila",     nisn: "0001234006", username: "farah.dkv1",   kelas: "XI DKV 1" },
    { name: "Gilang Permana",   nisn: "0001234007", username: "gilang.dkv1",  kelas: "XII DKV 1" },
    { name: "Hana Kusuma",      nisn: "0001234008", username: "hana.dkv1",    kelas: "XII DKV 1" },
  ];

  const dkvIds = [];
  for (const s of dkvStudents) {
    const student = await prisma.user.upsert({
      where:  { username: s.username },
      update: {},
      create: {
        id: uuidv4(), ...s,
        password: siswaPass,
        role:     "siswa",
        jurusan:  "DKV",
        isActive: true,
        isAlumni: false,
        parentId: wali1.id,
      },
    });
    dkvIds.push(student.id);
  }

  // ── 6. Siswa TSM ─────────────────────────────────────────
  const tsmStudents = [
    { name: "Iqbal Maulana",    nisn: "0002234001", username: "iqbal.tsm1",   kelas: "X TSM 1" },
    { name: "Joko Susanto",     nisn: "0002234002", username: "joko.tsm1",    kelas: "X TSM 1" },
    { name: "Kiki Ardiansyah",  nisn: "0002234003", username: "kiki.tsm1",    kelas: "X TSM 1" },
    { name: "Lutfi Hakim",      nisn: "0002234004", username: "lutfi.tsm1",   kelas: "XI TSM 1" },
    { name: "Mia Setiani",      nisn: "0002234005", username: "mia.tsm1",     kelas: "XI TSM 1" },
    { name: "Nando Putra",      nisn: "0002234006", username: "nando.tsm1",   kelas: "XII TSM 1" },
  ];

  for (const s of tsmStudents) {
    await prisma.user.upsert({
      where:  { username: s.username },
      update: {},
      create: {
        id: uuidv4(), ...s,
        password: siswaPass,
        role:     "siswa",
        jurusan:  "TSM",
        isActive: true,
        isAlumni: false,
      },
    });
  }

  // Update wali dengan studentIds DKV
  await prisma.user.update({
    where: { id: wali1.id },
    data:  { studentIds: JSON.stringify(dkvIds.slice(0, 2)) },
  });

  console.log("✅ Siswa DKV & TSM selesai.");

  console.log("\n🎉 Seed selesai! Akun tersedia:");
  console.log("   Admin   → username: admin       | pass: admin123");
  console.log("   Guru    → username: guru.budi   | pass: guru123");
  console.log("   Siswa   → username: rizky.dkv1  | pass: siswa123 | kelas: X DKV 1");
  console.log("   Wali    → username: wali.andi   | pass: wali123");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
