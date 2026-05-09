"use client";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Bell, CheckCircle, Clock, UserX, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AttendanceRecord } from "@/lib/types";

export default function WaliDashboard() {
  const { currentUser, records, notifications, parents, students } = useStore();
  const [mounted, setMounted] = useState(false);
   
   
   
  useEffect(() => setMounted(true), []);

  if (!currentUser || !mounted) return null;

  const getStudentIds = () => {
    try {
      const wali = currentUser as import("@/lib/types").Parent;
      if (typeof wali.studentIds === "string") {
        return JSON.parse(wali.studentIds) as string[];
      }
      if (Array.isArray(wali.studentIds)) {
        return wali.studentIds;
      }
    } catch {
      return [];
    }
    return [];
  };

  const studentIds = getStudentIds();
  const myStudents = students.filter((s) => studentIds.includes(s.id));

  const myRecords: AttendanceRecord[] = records.filter((r) =>
    studentIds.includes(r.studentId)
  );

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = myRecords.filter((r) => r.date === today);
  const myNotifs = notifications.filter((n) => studentIds.includes(n.studentId));

  const totalDays  = myRecords.length;
  const hadirDays  = myRecords.filter((r) => r.status === "hadir").length;
  const telatDays  = myRecords.filter((r) => r.status === "terlambat").length;
  const absenDays  = myRecords.filter((r) => r.status === "tidak_hadir").length;
  const rate = totalDays > 0 ? Math.round(((hadirDays + telatDays) / totalDays) * 100) : 0;

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Portal Wali Murid</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Selamat datang, {currentUser.name} · {format(new Date(), "EEEE, dd MMMM yyyy", { locale: idLocale })}
        </p>
      </div>

      {/* Child info cards */}
      {myStudents.map((student) => {
        const todayRec = todayRecords.find((r) => r.studentId === student.id);
        return (
          <div key={student.id} className="glass-card" style={{ padding: 20, marginBottom: 16,
            background: "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.04))",
            border: "1px solid rgba(99,102,241,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--gradient-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 800, color: "white", flexShrink: 0 }}>
                {student.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{student.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {student.kelas} · {student.jurusan} · NISN: {student.nisn}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Kehadiran Hari Ini</div>
                {todayRec ? (
                  <StatusBadge status={todayRec.status} />
                ) : (
                  <span className="badge badge-danger">Belum Absen</span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Hadir",    value: hadirDays, icon: CheckCircle, type: "success", color: "#10b981" },
          { label: "Terlambat",      value: telatDays, icon: Clock,       type: "warning", color: "#f59e0b" },
          { label: "Tidak Hadir",    value: absenDays, icon: UserX,       type: "danger",  color: "#ef4444" },
          { label: "Tingkat Hadir",  value: `${rate}%`,icon: TrendingUp,  type: "primary", color: "#6366f1" },
        ].map((c) => (
          <div key={c.label} className={`stat-card ${c.type}`}>
            <c.icon size={20} color={c.color} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 28, fontWeight: 800 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Recent attendance */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={18} color="var(--accent-primary)" /> Riwayat Kehadiran Terbaru
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>Tanggal</th><th>Nama Siswa</th><th>Status</th><th>Jam Masuk</th><th>Jam Keluar</th></tr>
            </thead>
            <tbody>
              {myRecords.slice(0, 15).map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {format(new Date(r.date), "EEE, dd MMM yyyy", { locale: idLocale })}
                  </td>
                  <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{r.studentName}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.checkIn?.time ?? "–"}</td>
                  <td>{r.checkOut?.time ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={18} color="var(--accent-primary)" /> Notifikasi Saya ({myNotifs.length})
        </div>
        {myNotifs.length === 0 ? (
          <div style={{ textAlign: "center", color: "#10b981", padding: "24px 0" }}>
            <CheckCircle size={36} style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 600 }}>Tidak ada notifikasi ketidakhadiran 🎉</div>
          </div>
        ) : (
          myNotifs.map((n) => (
            <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 0", borderBottom: "1px solid var(--border-glass)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={16} color="#f59e0b" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  {new Date(n.sentAt).toLocaleString("id-ID")} · {n.type}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
