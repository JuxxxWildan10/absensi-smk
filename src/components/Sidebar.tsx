"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield, LayoutDashboard, Users, ClipboardList, Bell,
  BarChart3, FileText, Settings, LogOut, Menu, X,
  MapPin, Camera, UserCheck, BookOpen, Calendar, ShieldCheck, Clock,
  Megaphone, FileCheck, User, BarChart2, Baby, GraduationCap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { UserRole } from "@/lib/types";
import NotificationBell from "./NotificationBell";

// Konfigurasi menu navigasi dinamis berdasarkan peran pengguna (Role-Based Access Control)
// Memisahkan akses menu untuk admin, guru, siswa, dan wali murid
const NAV_BY_ROLE: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/students", label: "Siswa", icon: Users },
    { href: "/dashboard/admin/alumni", label: "Alumni", icon: GraduationCap },
    { href: "/dashboard/admin/teachers", label: "Guru", icon: UserCheck },
    { href: "/dashboard/admin/classes", label: "Kelas", icon: BookOpen },
    { href: "/dashboard/admin/wali", label: "Wali Murid", icon: Users },
    { href: "/dashboard/admin/schedules", label: "Jadwal Pelajaran", icon: Clock },
    { href: "/dashboard/admin/izin", label: "Izin & Dispensasi", icon: FileCheck },
    { href: "/dashboard/admin/rekap", label: "Rekap & Analitik", icon: BarChart2 },
    { href: "/dashboard/admin/kalender", label: "Kalender Akademik", icon: Calendar },
    { href: "/dashboard/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
    { href: "/dashboard/admin/reports", label: "Laporan", icon: FileText },
    { href: "/dashboard/admin/notif", label: "Notifikasi", icon: Bell },
    { href: "/dashboard/admin/audit", label: "Audit Log", icon: ShieldCheck },
    { href: "/dashboard/admin/settings", label: "Pengaturan", icon: Settings },
    { href: "/dashboard/admin/profil", label: "Profil", icon: User },
  ],
  guru: [
    { href: "/dashboard/guru", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/guru/attendance", label: "Absensi Harian", icon: ClipboardList },
    { href: "/dashboard/guru/mapel", label: "Absensi Mapel", icon: BookOpen },
    { href: "/dashboard/guru/izin", label: "Izin Siswa", icon: FileCheck },
    { href: "/dashboard/guru/rekap", label: "Rekap & Analitik", icon: BarChart2 },
    { href: "/dashboard/guru/students", label: "Data Siswa", icon: Users },
    { href: "/dashboard/guru/kalender", label: "Kalender Akademik", icon: Calendar },
    { href: "/dashboard/guru/reports", label: "Laporan", icon: FileText },
    { href: "/dashboard/guru/notif", label: "Notifikasi", icon: Bell },
    { href: "/dashboard/guru/profil", label: "Profil", icon: User },
  ],
  siswa: [
    { href: "/dashboard/siswa", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/siswa/absensi", label: "Absensi Sekolah", icon: Camera },
    { href: "/dashboard/siswa/mapel", label: "Absensi Mapel", icon: BookOpen },
    { href: "/dashboard/siswa/riwayat", label: "Riwayat", icon: ClipboardList },
    { href: "/dashboard/siswa/izin", label: "Izin & Dispensasi", icon: FileCheck },
    { href: "/dashboard/siswa/kalender", label: "Kalender Akademik", icon: Calendar },
    { href: "/dashboard/siswa/pengumuman", label: "Pengumuman", icon: Megaphone },
    { href: "/dashboard/siswa/profil", label: "Profil", icon: User },
  ],
  wali: [
    { href: "/dashboard/wali", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/wali/anak", label: "Data Anak", icon: Baby },
    { href: "/dashboard/wali/riwayat", label: "Riwayat Absen", icon: ClipboardList },
    { href: "/dashboard/wali/kalender", label: "Kalender Akademik", icon: Calendar },
    { href: "/dashboard/wali/notif", label: "Notifikasi", icon: Bell },
    { href: "/dashboard/wali/profil", label: "Profil", icon: User },
  ],
};

// Konfigurasi visual untuk badge peran (label dan warna)
// Digunakan untuk menampilkan peran pengguna di profil sidebar
const ROLE_BADGE: Record<UserRole, { label: string; color: string }> = {
  admin: { label: "Administrator", color: "#6366f1" },
  guru: { label: "Guru / Dosen", color: "#8b5cf6" },
  siswa: { label: "Siswa", color: "#10b981" },
  wali: { label: "Wali Murid", color: "#f59e0b" },
};

// Komponen utama Sidebar
// Bertanggung jawab untuk merender navigasi samping, informasi profil, dan fungsi logout
export default function Sidebar() {
  const router = useRouter(); // Hook untuk navigasi halaman
  const pathname = usePathname(); // Hook untuk mendapatkan path URL aktif saat ini
  
  // Mengambil state user dan fungsi logout dari Zustand store
  const { currentUser, logout } = useStore(); 
  // State untuk mengontrol sidebar pada tampilan mobile
  const [mobileOpen, setMobileOpen] = useState(false); 

  if (!currentUser) return null; // Sembunyikan sidebar jika belum login

  // Menyesuaikan menu navigasi dengan peran user yang sedang login
  const nav = NAV_BY_ROLE[currentUser.role] ?? [];
  const role = ROLE_BADGE[currentUser.role];

  // Fungsi untuk menangani proses logout dan redirect ke halaman login
  const handleLogout = () => { logout(); router.push("/login"); };

  // Komponen internal untuk konten sidebar (Logo, Profil, Menu, Logout)
  // Dipisahkan agar dapat digunakan ulang pada sidebar versi desktop dan mobile
  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border-glass)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <img 
              src="/logo-smk.jpg" 
              alt="Logo SMK Arya Singasari" 
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", background: "white", padding: 2 }} 
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }} className="gradient-text">SMK ARYA SINGASARI</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Absensi Digital PWA</div>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-glass)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0
          }}>
            {currentUser.name.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentUser.name}
            </div>
            <span style={{
              fontSize: 10, padding: "2px 7px", borderRadius: 10,
              background: `${role.color}20`, color: role.color, fontWeight: 600
            }}>
              {role.label}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation - Render setiap menu sesuai Role */}
      <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== `/dashboard/${currentUser.role}` && pathname.startsWith(item.href + "/"));
          const exactActive = pathname === item.href;
          const isActive = item.href === `/dashboard/${currentUser.role}` ? exactActive : active;
          return (
            <Link key={item.href} href={item.href}
              className={`sidebar-link${isActive ? " active" : ""}`}
              onClick={() => setMobileOpen(false)}>
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "14px 12px", borderTop: "1px solid var(--border-glass)" }}>
        <button onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "10px 12px", background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: 14, fontWeight: 500, borderRadius: "var(--radius-md)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "none"; }}>
          <LogOut size={17} />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - Tampil secara default di layar besar */}
      <aside className="sidebar" style={{ display: "flex", flexDirection: "column" }}>
        <SidebarContent />
      </aside>

      {/* Mobile toggle - Tombol hamburger untuk membuka sidebar di layar kecil */}
      <button onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: "none", position: "fixed", top: 16, left: 16, zIndex: 200,
          width: 40, height: 40, borderRadius: 10, background: "var(--bg-secondary)",
          border: "1px solid var(--border-glass)", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-primary)"
        }}
        className="mobile-menu-btn">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay - Latar belakang gelap saat sidebar mobile terbuka */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99 }} />
      )}

      {/* Mobile sidebar - Panel sidebar yang muncul dari kiri pada layar kecil */}
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 260, zIndex: 100,
        background: "var(--bg-secondary)", borderRight: "1px solid var(--border-glass)",
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease", display: "flex", flexDirection: "column"
      }}>
        <SidebarContent />
      </aside>

      <style>{`@media(max-width:768px){.mobile-menu-btn{display:flex!important}}`}</style>
    </>
  );
}
