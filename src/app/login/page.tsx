"use client";
import Link from "next/link";
import { Shield, User, Users, GraduationCap, ArrowRight, Settings } from "lucide-react";

export default function LoginSelectionPage() {
  const PORTALS = [
    { id: "admin", label: "Portal Admin", desc: "Manajemen data sekolah & laporan", icon: Settings, color: "#6366f1" },
    { id: "guru",  label: "Portal Guru",  desc: "Absensi mapel & pemantauan kelas", icon: GraduationCap, color: "#8b5cf6" },
    { id: "siswa", label: "Portal Siswa", desc: "Absensi harian & riwayat",        icon: User, color: "#10b981" },
    { id: "wali",  label: "Portal Wali",  desc: "Pemantauan aktivitas anak",        icon: Users, color: "#f59e0b" },
  ];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--gradient-hero)", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)", top:"-10%", left:"-10%", filter:"blur(40px)" }} />
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)", bottom:"-10%", right:"-10%", filter:"blur(40px)" }} />

      <div style={{ width: "100%", maxWidth: 500, padding: "0 24px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }} className="animate-fadeInUp">
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
          }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
            Pilih <span className="gradient-text">Portal Akses</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            Masuk sesuai dengan hak akses Anda
          </p>
        </div>

        <div className="glass-card animate-fadeInUp stagger-1" style={{ padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PORTALS.map((p) => (
              <Link key={p.id} href={`/login/${p.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", borderRadius: 12, background: "var(--bg-glass)",
                  border: `1px solid ${p.color}30`, transition: "all 0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${p.color}10`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-glass)";
                  e.currentTarget.style.transform = "none";
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p.icon size={20} color={p.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{p.desc}</div>
                    </div>
                  </div>
                  <ArrowRight size={18} color="var(--text-muted)" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="animate-fadeInUp stagger-2" style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
