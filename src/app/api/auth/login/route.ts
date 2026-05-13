// ============================================================
// API Route: POST /api/auth/login
// Autentikasi berbasis Database (Prisma + bcrypt)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "absensi-skripsi-super-secret-key-2026"
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim();
    const password = (body.password || "").trim();
    const kelas = body.kelas;
    const deviceId = body.deviceId;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username dan password wajib diisi" }, { status: 400 });
    }

    // Gunakan findFirst dengan mode insensitive untuk mengatasi auto-capitalize dari keyboard HP
    const user = await prisma.user.findFirst({
      where: {
        username: { equals: username, mode: "insensitive" },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Username tidak ditemukan" }, { status: 401 });
    }

    // Blokir alumni
    if (user.role === "siswa" && user.isAlumni) {
      return NextResponse.json({ success: false, message: "Akses Ditolak: Akun alumni sudah tidak memiliki akses login." }, { status: 403 });
    }

    // Validasi kelas untuk siswa
    if (user.role === "siswa") {
      if (!kelas) return NextResponse.json({ success: false, message: "Harap pilih kelas Anda" }, { status: 400 });
      if (user.kelas !== kelas) return NextResponse.json({ success: false, message: "Kelas yang dipilih tidak sesuai data siswa" }, { status: 401 });
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
    const { password: _, ...safeUser } = user;

    // Generate JWT Token
    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, message: "Login berhasil", user: safeUser });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("[API/auth/login]", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
