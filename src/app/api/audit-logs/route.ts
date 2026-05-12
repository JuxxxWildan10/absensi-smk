import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// GET - Ambil audit log (max 500)
export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 500,
    });
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("[API/audit-logs GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil audit log" }, { status: 500 });
  }
}

// POST - Tambah audit log baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const log = await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        userId: body.userId,
        userName: body.userName,
        role: body.role,
        action: body.action,
        target: body.target,
        detail: body.detail,
        timestamp: body.timestamp || new Date().toISOString(),
      },
    });
    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    console.error("[API/audit-logs POST]", error);
    return NextResponse.json({ success: false, message: "Gagal mencatat audit log" }, { status: 500 });
  }
}
