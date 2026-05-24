export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "absensi-skripsi-super-secret-key-2026"
);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden: Admin only" }, { status: 403 });
    }

    const { id } = await params;

    const student = await prisma.user.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ success: false, message: "Siswa tidak ditemukan" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { deviceId: null },
    });

    return NextResponse.json({ success: true, message: "Device binding berhasil direset" });
  } catch (error) {
    console.error("[API/students/unbind]", error);
    return NextResponse.json({ success: false, message: "Gagal mereset device binding" }, { status: 500 });
  }
}
