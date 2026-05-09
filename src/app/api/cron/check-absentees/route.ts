// ============================================================
// API Route: POST /api/cron/check-absentees
// Memeriksa siswa yang belum absen setelah batas check-in dan mengirim notif Alpa
// ============================================================
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";
  return handleCron(force);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";
  return handleCron(force);
}

async function handleCron(force: boolean = false) {
  try {
    const config = await prisma.schoolConfig.findFirst();
    if (!config) return NextResponse.json({ success: false, message: "Konfigurasi tidak ditemukan" });

    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const currentTime = format(now, "HH:mm");

    // Jika waktu belum melewati batas check-in, belum saatnya menghitung Alpa (Kecuali force = true)
    if (currentTime <= config.checkInEnd && !force) {
      return NextResponse.json({ success: true, message: "Belum waktunya cut-off absensi. Tunggu jam " + config.checkInEnd });
    }

    // Cari semua siswa aktif
    const students = await prisma.user.findMany({
      where: { role: "siswa", isActive: true, isAlumni: false },
    });

    // Cari absensi hari ini
    const todayRecords = await prisma.attendanceRecord.findMany({
      where: { date: today },
    });

    // Cari izin hari ini
    const todayPermits = await prisma.permitRequest.findMany({
      where: { status: "approved", startDate: { lte: today }, endDate: { gte: today } },
    });

    const absenHariIniIds = todayRecords.map(r => r.studentId);
    const izinHariIniIds  = todayPermits.map(p => p.studentId);

    let notifyCount = 0;

    for (const student of students) {
      // Jika siswa belum ada di record absensi DAN tidak ada izin
      if (!absenHariIniIds.includes(student.id) && !izinHariIniIds.includes(student.id)) {
        
        // Cek apakah notifikasi alpa sudah dikirim hari ini untuk siswa ini
        const existingNotif = await prisma.inAppNotification.findFirst({
          where: { 
            title: "⚠️ Peringatan Ketidakhadiran (Alpa)",
            message: { contains: student.name },
            createdAt: { gte: new Date(today) }
          }
        });

        if (!existingNotif && student.parentId) {
          const msg = `Anak Anda, ${student.name} (${student.kelas}), belum melakukan check-in absensi hari ini hingga pukul ${currentTime}. Status saat ini: ALPA.`;
          
          await prisma.inAppNotification.create({
            data: {
              id: uuidv4(),
              userId: student.parentId,
              title: "⚠️ Peringatan Ketidakhadiran (Alpa)",
              message: msg,
              type: "danger",
            }
          });

          // Fetch parent to check if they have a pushSubscription
          const parent = await prisma.user.findUnique({ where: { id: student.parentId } });
          if (parent?.pushSubscription) {
            const { sendWebPushNotification } = await import("@/lib/webPush");
            await sendWebPushNotification(parent.pushSubscription, "⚠️ Peringatan Ketidakhadiran (Alpa)", msg);
          }
          
          notifyCount++;
        }
      }
    }

    return NextResponse.json({ success: true, message: `Pengecekan selesai. ${notifyCount} notifikasi Alpa baru dikirim.` });
  } catch (error) {
    console.error("[CRON/check-absentees]", error);
    return NextResponse.json({ success: false, message: "Gagal memproses cron job" }, { status: 500 });
  }
}
