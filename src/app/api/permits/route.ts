// ============================================================
// API Route: GET  /api/permits  → Daftar pengajuan izin
//            POST /api/permits  → Buat permohonan izin
//            PATCH /api/permits → Approve/Reject izin (guru/admin)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// GET - Ambil daftar izin
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const status    = searchParams.get("status"); // "pending", "approved", "rejected"
    const kelas     = searchParams.get("kelas");

    const permits = await prisma.permitRequest.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(status    ? { status }    : {}),
        ...(kelas     ? { kelas }     : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: permits });
  } catch (error) {
    console.error("[API/permits GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data izin" }, { status: 500 });
  }
}

// POST - Ajukan izin baru
export async function POST(req: NextRequest) {
  try {
    const { studentId, studentName, kelas, type, startDate, endDate, reason, attachmentUrl } = await req.json();

    if (!studentId || !type || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    const permit = await prisma.permitRequest.create({
      data: {
        id: uuidv4(),
        studentId, studentName, kelas,
        type, startDate, endDate, reason,
        attachmentUrl: attachmentUrl || null,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, data: permit }, { status: 201 });
  } catch (error) {
    console.error("[API/permits POST]", error);
    return NextResponse.json({ success: false, message: "Gagal mengajukan izin" }, { status: 500 });
  }
}

// PATCH - Approve atau Reject izin oleh guru/admin
export async function PATCH(req: NextRequest) {
  try {
    const { id, action, approvedBy, rejectedReason } = await req.json();
    // action: "approve" | "reject"

    if (!id || !action) {
      return NextResponse.json({ success: false, message: "id dan action diperlukan" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const updated = await prisma.permitRequest.update({
      where: { id },
      data: {
        status:         action === "approve" ? "approved" : "rejected",
        approvedBy:     action === "approve" ? (approvedBy || "Admin") : null,
        approvedAt:     action === "approve" ? now : null,
        rejectedReason: action === "reject"  ? (rejectedReason || "Tidak disetujui") : null,
      },
    });

    // Buat izin ini menjadi rekam absensi jika approved
    if (action === "approve") {
      await prisma.attendanceRecord.upsert({
        where: { id: `${updated.studentId}_${updated.startDate}` },
        update: { status: updated.type },
        create: {
          id: `${updated.studentId}_${updated.startDate}`,
          studentId: updated.studentId,
          studentName: updated.studentName,
          kelas: updated.kelas,
          date: updated.startDate,
          status: updated.type, // "izin" atau "sakit"
          notes: updated.reason,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: approvedBy || "system",
        userName: approvedBy || "System",
        role: "guru",
        action: action === "approve" ? "APPROVE_IZIN" : "REJECT_IZIN",
        target: updated.studentName,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API/permits PATCH]", error);
    return NextResponse.json({ success: false, message: "Gagal update status izin" }, { status: 500 });
  }
}
