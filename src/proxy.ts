import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "absensi-skripsi-super-secret-key-2026"
);

// Rute API yang tidak memerlukan autentikasi
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/seed",
  "/api/reset-admin",
  "/api/push/subscribe", // Push notifications bisa public jika pakai Vapid
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Hanya memproteksi rute /api
  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Akses Ditolak: Token tidak ditemukan" }, { status: 401 });
    }

    try {
      // Verifikasi token
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.json({ success: false, message: "Akses Ditolak: Token tidak valid atau kadaluarsa" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
