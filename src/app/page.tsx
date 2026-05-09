"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Shield, MapPin, Camera, Bell, Users, BarChart3,
  CheckCircle, ArrowRight, Smartphone, Star, Zap
} from "lucide-react";

const FEATURES = [
  { icon: MapPin,    color: "#6366f1", title: "Geofencing GPS",        desc: "Validasi lokasi dengan radius 50–100m menggunakan HTML5 Geolocation API" },
  { icon: Camera,    color: "#8b5cf6", title: "Face Recognition AI",   desc: "Verifikasi identitas siswa dengan TensorFlow.js & liveness detection" },
  { icon: Bell,      color: "#10b981", title: "Notifikasi Wali Murid", desc: "Push notification & WhatsApp otomatis jika siswa tidak hadir" },
  { icon: BarChart3, color: "#f59e0b", title: "Dashboard Analytics",   desc: "Grafik kehadiran real-time, statistik keterlambatan, monitoring bolos" },
  { icon: Users,     color: "#3b82f6", title: "Multi-Role System",     desc: "Admin, Guru, Siswa, dan Wali Murid dalam satu platform terintegrasi" },
  { icon: Smartphone,color: "#ec4899", title: "PWA Installable",       desc: "Bisa diinstall di HP/PC, bekerja offline, notifikasi push native" },
];

const STATS = [
  { label: "Akurasi Face Recognition", value: "98.7%", icon: Camera },
  { label: "Radius Geofencing",        value: "50–100m", icon: MapPin },
  { label: "Pengiriman Notifikasi",    value: "<3 detik", icon: Bell },
  { label: "Kompatibilitas Device",    value: "99%",  icon: Smartphone },
];



import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

// Komponen Halaman Utama (Landing Page) PWA
// Menampilkan penjelasan produk, fitur unggulan (Geofencing & AI), serta tautan (shortcut) login akun demo
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, currentUser } = useStore();
   
  useEffect(() => {
    setMounted(true);
    // Jika user sudah login, langsung redirect ke dashboard sesuai rolenya
    if (isAuthenticated && currentUser?.role) {
      router.replace(`/dashboard/${currentUser.role}`);
    }
  }, [isAuthenticated, currentUser, router]);

  // Cegah render landing page berkedip jika sedang proses redirect
  if (isAuthenticated) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 md:px-12 backdrop-blur-md border-b border-white/10"
        style={{
          background: "rgba(10,14,26,0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img 
            src="/logo-smk.jpg" 
            alt="Logo SMK" 
            style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", background: "white", padding: 2 }} 
          />
          <div>
            <div style={{ fontSize: "clamp(14px, 3vw, 18px)", fontWeight: 800, letterSpacing: "-0.3px" }}
              className="gradient-text">SMK ARYA SINGASARI</div>
            <div className="hidden sm:block" style={{ fontSize: 11, color: "var(--text-muted)" }}>Smart Attendance System</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/login" className="btn-secondary hidden sm:flex" style={{ padding: "8px 16px", fontSize: 14 }}>
            Masuk
          </Link>
          <Link href="/login" className="btn-primary" style={{ padding: "8px 16px", fontSize: 14 }}>
            Coba Gratis <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      {/* Bagian pengantar utama layar penuh dengan judul, deskripsi, dan tombol Call to Action (Mulai Sekarang) */}
      <section className="relative flex flex-col items-center justify-center min-h-screen pt-24 pb-16 px-4 overflow-hidden"
        style={{
        background: "var(--gradient-hero)",
      }}>
        {/* Background blobs */}
        <div style={{
          position: "absolute", width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          top: "10%", left: "20%", filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
          bottom: "15%", right: "15%", filter: "blur(40px)",
        }} />

        <div style={{ textAlign: "center", maxWidth: 860, padding: "0 24px", position: "relative", zIndex: 1 }}>
          <div className="animate-fadeInUp" style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24,
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 20, padding: "8px 16px", fontSize: 13, color: "#818cf8",
          }}>
            <Zap size={14} /> Sistem Absensi Generasi Berikutnya
          </div>

          <h1 className="animate-fadeInUp stagger-1" style={{
            fontSize: "clamp(32px, 7vw, 72px)", fontWeight: 900,
            lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 20,
          }}>
            Absensi Digital{" "}
            <span className="gradient-text">Cerdas & Aman</span>
            <br />dengan AI + GPS
          </h1>

          <p className="animate-fadeInUp stagger-2" style={{
            fontSize: "clamp(14px, 2.5vw, 20px)", color: "var(--text-secondary)",
            lineHeight: 1.6, marginBottom: 32, maxWidth: 600, margin: "0 auto 32px",
          }}>
            Eliminasi titip absen dengan verifikasi wajah real-time dan geofencing GPS.
            Notifikasi otomatis ke wali murid jika siswa tidak hadir.
          </p>

          <div className="animate-fadeInUp stagger-3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" className="btn-primary" style={{ fontSize: "clamp(14px, 2.5vw, 16px)", padding: "12px 28px" }}>
              Mulai Sekarang <ArrowRight size={18} className="ml-2" />
            </Link>
            <Link href="#fitur" className="btn-secondary" style={{ fontSize: "clamp(14px, 2.5vw, 16px)", padding: "12px 28px" }}>
              Lihat Fitur
            </Link>
          </div>

          {/* Stats row */}
          <div className="animate-fadeInUp stagger-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-12 md:mt-16 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="glass-card" style={{ padding: "14px 8px", textAlign: "center" }}>
                <div style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800 }} className="gradient-text">{s.value}</div>
                <div style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      {/* Grid tampilan daftar fitur unggulan (Geofencing, Face Recognition, Notifikasi WhatsApp, PWA, dll) */}
      <section id="fitur" className="px-4 py-16 md:px-12 md:py-24 max-w-7xl mx-auto">
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 13, color: "var(--accent-primary)", fontWeight: 600, marginBottom: 12, letterSpacing: 1 }}>
            FITUR UNGGULAN
          </div>
          <h2 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 800, letterSpacing: "-0.5px" }}>
            Teknologi Terdepan untuk<br />
            <span className="gradient-text">Kehadiran yang Akurat</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="glass-card animate-fadeInUp"
              style={{ padding: 28, animationDelay: `${i * 0.1}s`, opacity: mounted ? 1 : 0 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `${f.color}20`, border: `1px solid ${f.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <f.icon size={24} color={f.color} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-16 md:px-12 md:py-20" style={{ background: "var(--bg-secondary)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
            Siap <span className="gradient-text">Mulai?</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 36, fontSize: 16, lineHeight: 1.7 }}>
            Hubungi administrator sekolah untuk mendapatkan akun akses sesuai peran Anda.
          </p>
          <Link href="/login" className="btn-primary" style={{ fontSize: 16, padding: "14px 36px" }}>
            Masuk ke Sistem <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="flex flex-col md:flex-row justify-between items-center gap-4 px-4 py-8 md:px-12 border-t border-white/10 text-center md:text-left mt-auto">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%" }} className="md:flex-row md:justify-between md:gap-10">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo-smk.jpg" alt="Logo" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "contain", background: "white" }} />
            <span style={{ fontWeight: 700, fontSize: "14px" }} className="gradient-text">ABSENSI SMK ARYA SINGASARI</span>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>© 2025 — Skripsi Sistem Informasi</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", marginTop: 8 }} className="md:mt-0">
          <Star size={12} color="#f59e0b" fill="#f59e0b" />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Dibuat dengan ❤️ untuk Pendidikan Indonesia</span>
        </div>
      </footer>
    </div>
  );
}
