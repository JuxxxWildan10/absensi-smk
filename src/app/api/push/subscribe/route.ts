export const dynamic = "force-dynamic";
// ============================================================
// API Route: POST /api/push/subscribe
// Menyimpan Web Push subscription dari browser ke database
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json();

    if (!userId || !subscription?.endpoint) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    // Simpan subscription ke field pushSubscription di User
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushSubscription: JSON.stringify(subscription),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/push/subscribe]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
