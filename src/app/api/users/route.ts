// ============================================================
// API Route: GET /api/users         → Ambil semua user
//            POST /api/users        → Tambah user baru (guru, wali, dll)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const users = await prisma.user.findMany({
      where: role ? { role } : {},
      orderBy: { name: "asc" },
    });

    const parsed = users.map(u => ({
      ...u,
      studentIds: u.studentIds ? JSON.parse(u.studentIds) : undefined,
    }));

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("[API/users GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, password, role, ...rest } = body;

    if (!name || !username || !password || !role) {
      return NextResponse.json({ success: false, message: "Field wajib tidak lengkap" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { username },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "Username sudah terdaftar" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        name, username, role,
        password: hashedPassword,
        isActive: true,
        ...rest,
        studentIds: rest.studentIds ? JSON.stringify(rest.studentIds) : null,
      },
    });

    await prisma.auditLog.create({
      data: { userId: "system", userName: "System", role: "admin", action: "TAMBAH_USER", target: name },
    });

    const { password: _, ...safe } = user;
    return NextResponse.json({ success: true, data: safe }, { status: 201 });

  } catch (error) {
    console.error("[API/users POST]", error);
    return NextResponse.json({ success: false, message: "Gagal menambah user" }, { status: 500 });
  }
}
