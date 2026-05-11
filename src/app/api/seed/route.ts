// ============================================================
// API Route: GET /api/seed
// Fungsi Khusus untuk memindahkan data DUMMY ke DATABASE REAL (Prisma)
// Hanya gunakan ini sekali untuk inisialisasi awal database
// ============================================================
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DUMMY_STUDENTS, DUMMY_TEACHERS, DUMMY_PARENTS, DUMMY_ATTENDANCE } from "@/lib/data";

export async function GET() {
  try {
    // 1. Masukkan Guru
    let addedGurus = 0;
    for (const guru of DUMMY_TEACHERS) {
      const exists = await prisma.user.findUnique({ where: { username: guru.username } });
      if (!exists) {
        await prisma.user.create({
          data: {
            id: guru.id,
            name: guru.name,
            username: guru.username,
            password: guru.password, // Sudah di-hash di data.ts
            role: "guru",
            nip: guru.nip,
            mataPelajaran: guru.mataPelajaran ? JSON.stringify(guru.mataPelajaran) : null,
            kelasWali: guru.kelasWali,
            phone: guru.phone,
            isActive: guru.isActive,
          }
        });
        addedGurus++;
      }
    }

    // 2. Masukkan Siswa
    let addedSiswa = 0;
    for (const siswa of DUMMY_STUDENTS) {
      const exists = await prisma.user.findUnique({ where: { username: siswa.username } });
      if (!exists) {
        await prisma.user.create({
          data: {
            id: siswa.id,
            name: siswa.name,
            username: siswa.username,
            password: siswa.password,
            role: "siswa",
            nisn: siswa.nisn,
            kelas: siswa.kelas,
            jurusan: siswa.jurusan,
            phone: siswa.phone,
            parentId: siswa.parentId,
            isActive: siswa.isActive,
          }
        });
        addedSiswa++;
      }
    }

    // 3. Masukkan Wali Murid
    let addedWali = 0;
    for (const wali of DUMMY_PARENTS) {
      const exists = await prisma.user.findUnique({ where: { username: wali.username } });
      if (!exists) {
        await prisma.user.create({
          data: {
            id: wali.id,
            name: wali.name,
            username: wali.username,
            password: wali.password,
            role: "wali",
            studentIds: JSON.stringify(wali.studentIds),
            waNumber: wali.waNumber,
            phone: wali.phone,
            isActive: wali.isActive,
          }
        });
        addedWali++;
      }
    }

    // 4. Masukkan Absensi
    let addedAbsen = 0;
    for (const absen of DUMMY_ATTENDANCE) {
      const exists = await prisma.attendanceRecord.findUnique({ where: { id: absen.id } });
      if (!exists) {
        await prisma.attendanceRecord.create({
          data: {
            id: absen.id,
            studentId: absen.studentId,
            studentName: absen.studentName,
            kelas: absen.kelas,
            date: absen.date,
            status: absen.status,
            checkIn: absen.checkIn ? JSON.stringify(absen.checkIn) : null,
            checkOut: absen.checkOut ? JSON.stringify(absen.checkOut) : null,
          }
        });
        addedAbsen++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Proses Seeding Berhasil! Data dummy berhasil dipindahkan ke Database Real.",
      details: {
        guru_baru: addedGurus,
        siswa_baru: addedSiswa,
        wali_baru: addedWali,
        absensi_baru: addedAbsen
      }
    });

  } catch (error: any) {
    console.error("[API/seed error]", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan saat seeding", error: error.message }, { status: 500 });
  }
}
