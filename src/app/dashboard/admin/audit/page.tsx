"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { AuditAction } from "@/lib/types";
import { ShieldCheck, Search, Filter, Clock } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Konfigurasi warna untuk setiap jenis aksi (AuditAction) agar mudah dibedakan secara visual
const ACTION_COLOR: Partial<Record<AuditAction, string>> = {
  LOGIN: "#10b981", LOGOUT: "#6366f1",
  TAMBAH_SISWA: "#3b82f6", EDIT_SISWA: "#f59e0b", HAPUS_SISWA: "#ef4444",
  TAMBAH_GURU: "#3b82f6", EDIT_GURU: "#f59e0b", HAPUS_GURU: "#ef4444",
  TAMBAH_KELAS: "#3b82f6", EDIT_KELAS: "#f59e0b", HAPUS_KELAS: "#ef4444",
  APPROVE_IZIN: "#10b981", REJECT_IZIN: "#ef4444",
  KIRIM_NOTIFIKASI: "#8b5cf6",
  ABSENSI_MASUK: "#10b981", ABSENSI_KELUAR: "#3b82f6",
  TAMBAH_PENGUMUMAN: "#f59e0b", HAPUS_PENGUMUMAN: "#ef4444",
  TAMBAH_EVENT: "#f97316", HAPUS_EVENT: "#ef4444",
  EDIT_PENGATURAN: "#94a3b8", EDIT_PROFIL: "#94a3b8",
};

const ROLE_COLOR: Record<string, string> = {
  admin: "#6366f1", guru: "#8b5cf6", siswa: "#10b981", wali: "#f59e0b",
};

// Komponen Halaman Audit Log (Dashboard Admin)
// Menampilkan rekam jejak aktivitas pengguna untuk tujuan pemantauan keamanan (monitoring)
export default function AdminAuditPage() {
  const { auditLogs } = useStore(); // Mengambil seluruh riwayat log dari state global
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  // Memfilter log berdasarkan input pencarian teks, dropdown role, dan dropdown aksi
  const filtered = auditLogs.filter(log => {
    const matchSearch = search === "" ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.target?.toLowerCase() ?? "").includes(search.toLowerCase());
    const matchRole = filterRole === "all" || log.role === filterRole;
    const matchAction = filterAction === "all" || log.action === filterAction;
    return matchSearch && matchRole && matchAction;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const uniqueActions = [...new Set(auditLogs.map(l => l.action))];

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={26} color="var(--accent-primary)" /> Audit Log Sistem
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Rekam jejak seluruh aktivitas pengguna dalam sistem untuk keamanan dan akuntabilitas.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Log", value: auditLogs.length, color: "#6366f1" },
          { label: "Hari Ini", value: auditLogs.filter(l => l.timestamp.startsWith(new Date().toISOString().split("T")[0])).length, color: "#10b981" },
          { label: "Login", value: auditLogs.filter(l => l.action === "LOGIN").length, color: "#3b82f6" },
          { label: "Perubahan Data", value: auditLogs.filter(l => ["TAMBAH_SISWA","EDIT_SISWA","HAPUS_SISWA","TAMBAH_GURU","EDIT_GURU","HAPUS_GURU"].includes(l.action)).length, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input-field" placeholder="Cari nama, aksi, target..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input-field" value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ width: "auto", colorScheme: "dark" }}>
          <option value="all">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="guru">Guru</option>
          <option value="siswa">Siswa</option>
          <option value="wali">Wali</option>
        </select>
        <select className="input-field" value={filterAction} onChange={e => setFilterAction(e.target.value)}
          style={{ width: "auto", colorScheme: "dark" }}>
          <option value="all">Semua Aksi</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {/* Log list */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>
          Menampilkan {filtered.length} dari {auditLogs.length} log
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
            <ShieldCheck size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div>Tidak ada log yang sesuai filter</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.map(log => (
              <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                  background: ACTION_COLOR[log.action] ?? "#94a3b8" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{log.userName}</span>
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10,
                      background: `${ROLE_COLOR[log.role]}18`, color: ROLE_COLOR[log.role] }}>
                      {log.role}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                      background: `${ACTION_COLOR[log.action] ?? "#94a3b8"}15`,
                      color: ACTION_COLOR[log.action] ?? "#94a3b8" }}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                    {log.target && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{log.target}</span>}
                  </div>
                  {log.detail && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{log.detail}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                  <Clock size={11} />
                  {format(new Date(log.timestamp), "dd MMM yyyy HH:mm", { locale: idLocale })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
