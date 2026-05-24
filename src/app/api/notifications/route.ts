export const dynamic = "force-dynamic";
// ============================================================
// API Route: GET  /api/notifications        → Ambil notif user
//            POST /api/notifications        → Buat notif baru
//            PATCH /api/notifications/[id]  → Tandai sudah dibaca
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// GET - Ambil semua notifikasi milik userId tertentu
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId diperlukan" }, { status: 400 });
    }

    const notifications = await prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error("[API/notifications GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil notifikasi" }, { status: 500 });
  }
}

// POST - Buat notifikasi baru
export async function POST(req: NextRequest) {
  try {
    const { userId, title, message, type, link } = await req.json();

    if (!userId || !title || !message) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    const notif = await prisma.inAppNotification.create({
      data: {
        id: uuidv4(),
        userId,
        title,
        message,
        type: type || "info",
        isRead: false,
        link: link || null,
      },
    });

    return NextResponse.json({ success: true, data: notif }, { status: 201 });
  } catch (error) {
    console.error("[API/notifications POST]", error);
    return NextResponse.json({ success: false, message: "Gagal membuat notifikasi" }, { status: 500 });
  }
}

// PATCH - Tandai semua notif user sebagai sudah dibaca
export async function PATCH(req: NextRequest) {
  try {
    const { userId, notifId } = await req.json();

    if (notifId) {
      // Tandai satu notif
      await prisma.inAppNotification.update({ where: { id: notifId }, data: { isRead: true } });
    } else if (userId) {
      // Tandai semua notif user
      await prisma.inAppNotification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/notifications PATCH]", error);
    return NextResponse.json({ success: false, message: "Gagal update notifikasi" }, { status: 500 });
  }
}
