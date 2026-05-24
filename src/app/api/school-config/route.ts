export const dynamic = "force-dynamic";
// ============================================================
// API Route: GET /api/school-config   → Ambil konfigurasi sekolah
//            PUT /api/school-config   → Update konfigurasi sekolah
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const config = await prisma.schoolConfig.findFirst();
    if (!config) {
      // Kembalikan default config dari seed data agar client tidak kosong
      return NextResponse.json({
        success: true,
        data: {
          id: "school-1",
          name: "SMK ARYA SINGASARI LARANGAN",
          address: "Jl. Pendidikan No. 1",
          latitude: -6.9597244,
          longitude: 108.9829353,
          radius: 100,
          checkInStart: "06:30",
          checkInEnd: "08:00",
          checkOutStart: "14:00",
          checkOutEnd: "17:00",
        },
      });
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

    // Cari user admin yang valid untuk AuditLog agar tidak kena foreign key error
    const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
    if (adminUser) {
      await prisma.auditLog.create({
        data: { userId: adminUser.id, userName: adminUser.name, role: "admin", action: "EDIT_PENGATURAN" },
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("[API/school-config PUT]", error);
    return NextResponse.json({ success: false, message: "Gagal update konfigurasi" }, { status: 500 });
  }
}
