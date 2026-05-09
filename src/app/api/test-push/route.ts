import { NextRequest, NextResponse } from "next/server";
import { sendWebPushNotification } from "@/lib/webPush";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, title, message } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID diperlukan" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user?.pushSubscription) {
      return NextResponse.json({ success: false, message: "User belum berlangganan notifikasi" }, { status: 400 });
    }

    const isSuccess = await sendWebPushNotification(user.pushSubscription, title || "🔔 Test Notifikasi", message || "Ini adalah simulasi push notification!");

    return NextResponse.json({ success: isSuccess });
  } catch (error) {
    console.error("Test push error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
