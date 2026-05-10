"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import FaceSetupModal from "@/components/FaceSetupModal";

// Komponen Layout Utama untuk Dashboard
// Membungkus semua halaman dashboard (admin, guru, siswa, wali) dengan layout standar yang memiliki Sidebar
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); // Hook untuk navigasi URL
  const { isAuthenticated } = useStore(); // Mengambil status autentikasi pengguna dari global store

  // Efek samping (side-effect) yang berjalan saat komponen dirender
  // Mengecek apakah pengguna sudah login, jika belum maka langsung dilempar (redirect) ke halaman login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    } else {
      // 1. Sinkronisasi Data dari Database (Tarik data terbaru)
      useStore.getState().hydrateFromDB();

      // Subscribe to Push Notifications
      import("@/lib/pushClient").then((mod) => {
        const userId = useStore.getState().currentUser?.id;
        if (userId) mod.subscribeToPush(userId);
      });

      // 2. Jalankan pengecekan absen otomatis ke Database (Cron) setiap kali dashboard dimuat
      const runCron = async () => {
        try {
          await fetch("/api/cron/check-absentees", { method: "POST" });
        } catch (e) {
          console.error("Cron failed:", e);
        }
      };
      
      runCron();
      
      // Polling: Sinkronkan Data dari Database setiap 15 detik agar Desktop dan HP "langsung terkoneksi"
      const syncInterval = setInterval(() => {
        useStore.getState().hydrateFromDB();
      }, 15 * 1000);

      // Pasang interval agar mengecek setiap 5 menit (jika tab dibiarkan terbuka terus)
      const cronInterval = setInterval(runCron, 5 * 60 * 1000);
      
      return () => {
        clearInterval(syncInterval);
        clearInterval(cronInterval);
      };
    }
  }, [isAuthenticated, router]);

  // Jika belum terautentikasi, jangan render apapun (mencegah kedipan UI sesaat sebelum redirect)
  if (!isAuthenticated) return null;

  return (
    // Container utama dengan flexbox untuk menyusun Sidebar dan konten utama bersebelahan
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Memanggil komponen Sidebar di sisi kiri */}
      <Sidebar />
      
      {/* Area konten utama yang akan diisi oleh halaman-halaman spesifik (children) */}
      <main className="main-content" style={{ flex: 1 }}>
        {children}
      </main>

      {/* Modal Pendaftaran Face ID (Hanya muncul jika siswa belum daftar wajah) */}
      <FaceSetupModal />
    </div>
  );
}
