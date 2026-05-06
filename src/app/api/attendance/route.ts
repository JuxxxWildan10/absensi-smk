// ============================================================
// API Route: GET  /api/attendance      → Rekap absensi
//            POST /api/attendance      → Check-in siswa
//            PUT  /api/attendance      → Check-out siswa
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// GET - Ambil rekap absensi (dengan filter opsional)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const kelas     = searchParams.get("kelas");
    const date      = searchParams.get("date");
    const dateFrom  = searchParams.get("from");
    const dateTo    = searchParams.get("to");
    const status    = searchParams.get("status");

    const records = await prisma.attendanceRecord.findMany({
      where: {
        ...(studentId ? { studentId }  : {}),
        ...(kelas     ? { kelas }       : {}),
        ...(status    ? { status }      : {}),
        ...(date      ? { date }        : {}),
        ...(dateFrom  ? { date: { gte: dateFrom } } : {}),
        ...(dateTo    ? { date: { lte: dateTo   } } : {}),
      },
      orderBy: { date: "desc" },
    });

    // Parse checkIn / checkOut dari JSON string
    const parsed = records.map(r => ({
      ...r,
      checkIn:  r.checkIn  ? JSON.parse(r.checkIn)  : undefined,
      checkOut: r.checkOut ? JSON.parse(r.checkOut) : undefined,
    }));

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("[API/attendance GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data absensi" }, { status: 500 });
  }
}

// POST - Check-in siswa
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, studentName, kelas, date, status, checkIn, notes } = body;

    if (!studentId || !date) {
      return NextResponse.json({ success: false, message: "studentId dan date wajib diisi" }, { status: 400 });
    }

    // Cek apakah sudah absen hari ini
    const existing = await prisma.attendanceRecord.findFirst({
      where: { studentId, date },
    });
    if (existing) {
      // Jika sudah ada, kembalikan data lama (idempotent)
      return NextResponse.json({
        success: false,
        message: "Sudah melakukan absensi hari ini",
        data: { ...existing, checkIn: existing.checkIn ? JSON.parse(existing.checkIn) : undefined },
      }, { status: 409 });
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        id: uuidv4(),
        studentId,
        studentName: studentName || "",
        kelas: kelas || "",
        date,
        status: status || "hadir",
        notes: notes || null,
        checkIn: checkIn ? JSON.stringify(checkIn) : null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: { userId: studentId, userName: studentName, role: "siswa", action: "ABSENSI_MASUK", target: date },
    });

    return NextResponse.json({
      success: true,
      data: { ...record, checkIn: record.checkIn ? JSON.parse(record.checkIn) : undefined },
    }, { status: 201 });

  } catch (error) {
    console.error("[API/attendance POST]", error);
    return NextResponse.json({ success: false, message: "Gagal menyimpan absensi" }, { status: 500 });
  }
}

// PUT - Check-out siswa
export async function PUT(req: NextRequest) {
  try {
    const { studentId, date, checkOut } = await req.json();

    if (!studentId || !date || !checkOut) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    const existing = await prisma.attendanceRecord.findFirst({ where: { studentId, date } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Data check-in tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut: JSON.stringify(checkOut) },
    });

    await prisma.auditLog.create({
      data: { userId: studentId, userName: existing.studentName, role: "siswa", action: "ABSENSI_KELUAR", target: date },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        checkIn:  updated.checkIn  ? JSON.parse(updated.checkIn)  : undefined,
        checkOut: updated.checkOut ? JSON.parse(updated.checkOut) : undefined,
      },
    });
  } catch (error) {
    console.error("[API/attendance PUT]", error);
    return NextResponse.json({ success: false, message: "Gagal menyimpan check-out" }, { status: 500 });
  }
}
