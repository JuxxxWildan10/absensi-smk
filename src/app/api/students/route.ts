export const dynamic = "force-dynamic";
// ============================================================
// API Route: GET /api/students         → Semua siswa
//            POST /api/students        → Tambah siswa baru
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// GET - Ambil semua siswa dari database
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kelas = searchParams.get("kelas");
    const isAlumni = searchParams.get("isAlumni") === "true";

    const students = await prisma.user.findMany({
      where: {
        role: "siswa",
        ...(kelas ? { kelas } : {}),
        isAlumni,
      },
      select: {
        id: true, name: true, username: true, role: true,
        nisn: true, kelas: true, jurusan: true, parentId: true,
        isAlumni: true, graduationYear: true, deviceId: true,
        faceDescriptor: true, isActive: true, createdAt: true,
        avatar: true, phone: true, email: true,
      },
      orderBy: { name: "asc" },
    });

    // Parse faceDescriptor dari JSON string ke number[]
    const parsed = students.map(s => ({
      ...s,
      faceDescriptor: s.faceDescriptor ? JSON.parse(s.faceDescriptor) : null,
    }));

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("[API/students GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data siswa" }, { status: 500 });
  }
}

// POST - Tambah siswa baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, nisn, username, password, kelas, jurusan, parentId } = body;

    if (!name || !nisn || !username || !password || !kelas) {
      return NextResponse.json({ success: false, message: "Field wajib tidak lengkap" }, { status: 400 });
    }

    // Cek duplikat username/NISN
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { nisn }] },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "Username atau NISN sudah terdaftar" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await prisma.user.create({
      data: {
        id: uuidv4(),
        name, nisn, username,
        password: hashedPassword,
        role: "siswa",
        kelas, jurusan: jurusan || "",
        parentId: parentId || null,
        isActive: true,
        isAlumni: false,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: { userId: "system", userName: "System", role: "admin", action: "TAMBAH_SISWA", target: name },
    });

     
    const { password: _, ...safe } = student;
    return NextResponse.json({ success: true, data: safe }, { status: 201 });

  } catch (error) {
    console.error("[API/students POST]", error);
    return NextResponse.json({ success: false, message: "Gagal menambah siswa" }, { status: 500 });
  }
}
