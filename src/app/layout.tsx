import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABSENSI DIGITAL SMK ARYA SINGASARI",
  description:
    "Sistem absensi digital cerdas berbasis PWA dengan teknologi Geofencing dan Face Recognition. Notifikasi otomatis ke wali murid jika siswa tidak hadir.",
  keywords: ["absensi", "face recognition", "geofencing", "PWA", "sekolah", "siswa"],
  authors: [{ name: "AbsensiCerdas Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ABSENSI DIGITAL SMK ARYA SINGASARI",
  },
  openGraph: {
    title: "ABSENSI DIGITAL SMK ARYA SINGASARI",
    description: "Absensi digital cerdas dengan Geofencing & Face Recognition",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import SyncProvider from "@/components/SyncProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning>
        <SyncProvider>
          {children}
        </SyncProvider>
      </body>
    </html>
  );
}
