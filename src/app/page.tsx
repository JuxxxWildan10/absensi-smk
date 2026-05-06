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

const DEMO_ACCOUNTS = [
  { role: "Admin",      href: "/login/admin", email: "admin",         color: "#6366f1", hint: "username: admin" },
  { role: "Guru",       href: "/login/guru",  email: "siti.rahayu",   color: "#8b5cf6", hint: "username: siti.rahayu" },
  { role: "Siswa",      href: "/login/siswa", email: "rizky.pratama", color: "#10b981", hint: "username: rizky.pratama" },
  { role: "Wali Murid", href: "/login/wali",  email: "pratama.ayah",  color: "#f59e0b", hint: "username: pratama.ayah" },
];

// Komponen Halaman Utama (Landing Page) PWA
// Menampilkan penjelasan produk, fitur unggulan (Geofencing & AI), serta tautan (shortcut) login akun demo
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(10,14,26,0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-glass)", padding: "16px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px" }}
              className="gradient-text">AbsensiCerdas</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Smart Attendance System</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/login" className="btn-secondary" style={{ padding: "10px 20px" }}>
            Masuk
          </Link>
          <Link href="/login" className="btn-primary" style={{ padding: "10px 20px" }}>
            Coba Gratis <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      {/* Bagian pengantar utama layar penuh dengan judul, deskripsi, dan tombol Call to Action (Mulai Sekarang) */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--gradient-hero)", paddingTop: 80,
        position: "relative", overflow: "hidden",
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
            fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900,
            lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 24,
          }}>
            Absensi Digital{" "}
            <span className="gradient-text">Cerdas & Aman</span>
            <br />dengan AI + GPS
          </h1>

          <p className="animate-fadeInUp stagger-2" style={{
            fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text-secondary)",
            lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px",
          }}>
            Eliminasi titip absen dengan verifikasi wajah real-time dan geofencing GPS.
            Notifikasi otomatis ke wali murid jika siswa tidak hadir.
          </p>

          <div className="animate-fadeInUp stagger-3" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" className="btn-primary" style={{ fontSize: 16, padding: "14px 32px" }}>
              Mulai Sekarang <ArrowRight size={18} />
            </Link>
            <Link href="#fitur" className="btn-secondary" style={{ fontSize: 16, padding: "14px 32px" }}>
              Lihat Fitur
            </Link>
          </div>

          {/* Stats row */}
          <div className="animate-fadeInUp stagger-4" style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16,
            marginTop: 64, maxWidth: 700, marginLeft: "auto", marginRight: "auto",
          }}>
            {STATS.map((s) => (
              <div key={s.label} className="glass-card" style={{ padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800 }} className="gradient-text">{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      {/* Grid tampilan daftar fitur unggulan (Geofencing, Face Recognition, Notifikasi WhatsApp, PWA, dll) */}
      <section id="fitur" style={{ padding: "96px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 13, color: "var(--accent-primary)", fontWeight: 600, marginBottom: 12, letterSpacing: 1 }}>
            FITUR UNGGULAN
          </div>
          <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.5px" }}>
            Teknologi Terdepan untuk<br />
            <span className="gradient-text">Kehadiran yang Akurat</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 24 }}>
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

      {/* ── DEMO ACCOUNTS ── */}
      {/* Seksi khusus untuk menyajikan akun-akun demo (Admin, Guru, Siswa, Wali) agar penguji mudah masuk */}
      <section style={{ padding: "80px 48px", background: "var(--bg-secondary)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
            Coba <span className="gradient-text">Demo Sekarang</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 40 }}>
            Password semua akun: <code style={{ background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: 6, color: "#818cf8" }}>password123</code>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <Link key={acc.role} href={acc.href} style={{ textDecoration: "none" }}>
                <div className="glass-card" style={{ padding: 20, cursor: "pointer", textAlign: "left", border: `1px solid ${acc.color}30`, transition: "all 0.2s" }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.background = `${acc.color}10`; }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.background = ""; }}>
                  <div style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 20, background: `${acc.color}20`, color: acc.color, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{acc.role}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", wordBreak: "break-all" }}>{acc.hint}</div>
                  <div style={{ fontSize: 11, color: acc.color, marginTop: 8, fontWeight: 600 }}>→ Masuk ke Portal</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid var(--border-glass)", padding: "32px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={20} color="var(--accent-primary)" />
          <span style={{ fontWeight: 700 }} className="gradient-text">AbsensiCerdas</span>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>© 2025 — Skripsi Sistem Informasi</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Star size={14} color="#f59e0b" fill="#f59e0b" />
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Dibuat dengan ❤️ untuk Pendidikan Indonesia</span>
        </div>
      </footer>
    </div>
  );
}
