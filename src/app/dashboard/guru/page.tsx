"use client";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Users, ClipboardList, CheckCircle, Clock, UserX, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function GuruDashboard() {
  const { currentUser, students, records, getDashboardStats } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!currentUser || !mounted) return null;

  const teacher = currentUser as import("@/lib/types").Teacher;
  const myKelas = teacher.kelasWali ?? "";
  const myStudents = students.filter((s) => s.kelas === myKelas);

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.date === today && r.kelas === myKelas);

  const hadir  = todayRecords.filter((r) => r.status === "hadir").length;
  const telat  = todayRecords.filter((r) => r.status === "terlambat").length;
  const absen  = myStudents.length - todayRecords.filter((r) => r.status !== "tidak_hadir").length;

  const stats = getDashboardStats();
  const weeklyForClass = stats.weeklyData; // simplified

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Dashboard Guru</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          {format(new Date(), "EEEE, dd MMMM yyyy", { locale: idLocale })} · Kelas Wali: <strong style={{ color: "var(--text-primary)" }}>{myKelas || "–"}</strong>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Siswa",    value: myStudents.length, icon: Users,         type: "primary", color: "#6366f1" },
          { label: "Hadir Hari Ini", value: hadir,             icon: CheckCircle,   type: "success", color: "#10b981" },
          { label: "Terlambat",      value: telat,             icon: Clock,         type: "warning", color: "#f59e0b" },
          { label: "Tidak Hadir",    value: absen,             icon: UserX,         type: "danger",  color: "#ef4444" },
        ].map((c) => (
          <div key={c.label} className={`stat-card ${c.type}`}>
            <c.icon size={20} color={c.color} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 32, fontWeight: 800 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 size={18} color="var(--accent-primary)" /> Kehadiran Kelas 7 Hari Terakhir
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyForClass} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#0f1629", border: "1px solid var(--border-glass)", borderRadius: 10 }} />
            <Bar dataKey="hadir"       name="Hadir"       fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="terlambat"   name="Terlambat"   fill="#f59e0b" radius={[4,4,0,0]} />
            <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Today's class attendance */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardList size={18} color="var(--accent-primary)" /> Absensi Kelas Hari Ini
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>No</th><th>Nama Siswa</th><th>Status</th><th>Jam Masuk</th><th>Verifikasi</th></tr>
            </thead>
            <tbody>
              {myStudents.map((s, i) => {
                const rec = todayRecords.find((r) => r.studentId === s.id);
                return (
                  <tr key={s.id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{s.name}</td>
                    <td><StatusBadge status={rec?.status ?? "tidak_hadir"} /></td>
                    <td>{rec?.checkIn?.time ?? "–"}</td>
                    <td style={{ fontSize: 12 }}>
                      {rec?.checkIn ? <span style={{ color: "#10b981" }}>✓ Wajah & GPS</span>
                        : <span style={{ color: "var(--text-muted)" }}>–</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
