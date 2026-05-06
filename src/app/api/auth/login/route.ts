// ============================================================
// API Route: POST /api/auth/login
// Autentikasi berbasis Database (Prisma + bcrypt)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password, kelas, deviceId } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username dan password wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json({ success: false, message: "Username tidak ditemukan" }, { status: 401 });
    }

    // Blokir alumni
    if (user.role === "siswa" && user.isAlumni) {
      return NextResponse.json({ success: false, message: "Akses Ditolak: Akun alumni sudah tidak memiliki akses login." }, { status: 403 });
    }

    // Validasi kelas & device binding untuk siswa
    if (user.role === "siswa") {
      if (!kelas) return NextResponse.json({ success: false, message: "Harap pilih kelas Anda" }, { status: 400 });
      if (user.kelas !== kelas) return NextResponse.json({ success: false, message: "Kelas yang dipilih tidak sesuai data siswa" }, { status: 401 });

      if (deviceId) {
        if (user.deviceId && user.deviceId !== deviceId) {
          return NextResponse.json({
            success: false,
            message: "Akses Ditolak: Perangkat tidak dikenali. Akun Anda terikat ke perangkat lain. Hubungi Admin.",
          }, { status: 403 });
        }
        if (!user.deviceId) {
          await prisma.user.update({ where: { id: user.id }, data: { deviceId } });
        }
      }
    }

    // Verifikasi password (bcrypt)
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: "Password salah" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, message: "Akun tidak aktif" }, { status: 403 });
    }

    // Catat Audit Log
    await prisma.auditLog.create({
      data: { userId: user.id, userName: user.name, role: user.role, action: "LOGIN" },
    });

    // Kembalikan data user tanpa password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ success: true, message: "Login berhasil", user: safeUser });

  } catch (error) {
    console.error("[API/auth/login]", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
