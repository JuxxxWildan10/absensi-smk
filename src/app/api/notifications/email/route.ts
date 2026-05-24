export const dynamic = "force-dynamic";
// ============================================================
// API Route: POST /api/notifications/email
// ============================================================
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { to, studentName, kelas, date } = await req.json();

    if (!to || !studentName) {
      return NextResponse.json(
        { success: false, message: "Penerima dan nama siswa wajib diisi" },
        { status: 400 }
      );
    }

    // In production: use Nodemailer or SendGrid
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ ... });

    console.log(`[Email Notification] To: ${to}`);
    console.log(`Siswa: ${studentName} | Kelas: ${kelas} | Tanggal: ${date}`);
    console.log(`Pesan: Anak Anda tidak melakukan absensi hari ini.`);

    // Simulate email sending delay
    await new Promise((r) => setTimeout(r, 500));

    return NextResponse.json({
      success: true,
      message: `Email notifikasi berhasil dikirim ke ${to}`,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengirim email" },
      { status: 500 }
    );
  }
}
