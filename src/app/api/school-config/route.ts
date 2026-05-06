// ============================================================
// API Route: GET /api/school-config   → Ambil konfigurasi sekolah
//            PUT /api/school-config   → Update konfigurasi sekolah
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Ambil konfigurasi sekolah
export async function GET() {
  try {
    const config = await prisma.schoolConfig.findFirst();
    if (!config) {
      return NextResponse.json({ success: false, message: "Konfigurasi sekolah belum diatur" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("[API/school-config GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil konfigurasi" }, { status: 500 });
  }
}

// PUT - Update konfigurasi sekolah (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, latitude, longitude, radius, checkInStart, checkInEnd, checkOutStart, checkOutEnd } = body;

    const existing = await prisma.schoolConfig.findFirst();

    const data = {
      name:          name         || "SMK",
      address:       address      || "",
      latitude:      Number(latitude)  || 0,
      longitude:     Number(longitude) || 0,
      radius:        Number(radius)    || 100,
      checkInStart:  checkInStart  || "07:00",
      checkInEnd:    checkInEnd    || "07:30",
      checkOutStart: checkOutStart || "14:00",
      checkOutEnd:   checkOutEnd   || "16:00",
    };

    const config = existing
      ? await prisma.schoolConfig.update({ where: { id: existing.id }, data })
      : await prisma.schoolConfig.create({ data: { id: "school-1", ...data } });

    // Audit log
    await prisma.auditLog.create({
      data: { userId: "admin", userName: "Admin", role: "admin", action: "EDIT_PENGATURAN" },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("[API/school-config PUT]", error);
    return NextResponse.json({ success: false, message: "Gagal update konfigurasi" }, { status: 500 });
  }
}
