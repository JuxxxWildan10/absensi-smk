import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/config - Mengambil konfigurasi sekolah
export async function GET() {
  try {
    const config = await prisma.schoolConfig.findFirst();
    if (!config) {
      return NextResponse.json({ success: false, message: "Konfigurasi belum ada" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("[API/config GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil konfigurasi" }, { status: 500 });
  }
}

// PATCH /api/config - Memperbarui konfigurasi sekolah
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Cari config yang ada (biasanya hanya ada 1 baris)
    const existingConfig = await prisma.schoolConfig.findFirst();
    
    if (!existingConfig) {
      return NextResponse.json({ success: false, message: "Konfigurasi belum ada, harap jalankan seed." }, { status: 404 });
    }

    const updatedConfig = await prisma.schoolConfig.update({
      where: { id: existingConfig.id },
      data: body,
    });

    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (error) {
    console.error("[API/config PATCH]", error);
    return NextResponse.json({ success: false, message: "Gagal memperbarui konfigurasi" }, { status: 500 });
  }
}
