"use client";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import {
  Users, UserCheck, UserX, Clock, TrendingUp, Bell,
  AlertTriangle, CheckCircle, Calendar, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import StatusBadge from "@/components/StatusBadge";
import { DashboardStats } from "@/lib/types";

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function AdminDashboard() {
  const { getDashboardStats, getTodayAttendance, students, notifications } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStats(getDashboardStats());
    setMounted(true);
  }, [getDashboardStats]);

  if (!stats || !mounted) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 120 }} />
        ))}
      </div>
    );
  }

  const todayRecords = getTodayAttendance();
  const todayDate = format(new Date(), "EEEE, dd MMMM yyyy", { locale: idLocale });

  const pieData = [
    { name: "Hadir",       value: stats.presentToday },
    { name: "Terlambat",   value: stats.lateToday },
    { name: "Tidak Hadir", value: stats.absentToday },
  ];

  const STAT_CARDS = [
    { label: "Total Siswa",    value: stats.totalStudents, icon: Users,    type: "primary", sub: "Terdaftar" },
    { label: "Hadir Hari Ini", value: stats.presentToday, icon: UserCheck, type: "success", sub: "Tepat waktu & terlambat" },
    { label: "Terlambat",      value: stats.lateToday,    icon: Clock,     type: "warning", sub: "Melewati batas check-in" },
    { label: "Tidak Hadir",    value: stats.absentToday,  icon: UserX,     type: "danger",  sub: "Belum absen hari ini" },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:16 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, marginBottom:4 }}>Dashboard Admin</h1>
          <p style={{ color:"var(--text-muted)", fontSize:14 }}>{todayDate}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8,
          background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)",
          borderRadius:"var(--radius-md)", padding:"8px 14px", fontSize:13, color:"#10b981" }}>
          <CheckCircle size={15} /> Sistem Aktif
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
        {STAT_CARDS.map((card) => (
          <div key={card.label} className={`stat-card ${card.type} animate-fadeInUp`}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ fontSize:12, color:"var(--text-muted)", fontWeight:500 }}>{card.label}</div>
              <div style={{ width:36, height:36, borderRadius:10,
                background:"var(--bg-glass)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <card.icon size={18} color="var(--accent-primary)" />
              </div>
            </div>
            <div style={{ fontSize:34, fontWeight:800, lineHeight:1 }}>{card.value}</div>
            <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:6 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Attendance Rate Banner */}
      <div className="glass-card" style={{ padding:20, marginBottom:24,
        background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.06))",
        border:"1px solid rgba(99,102,241,0.2)", display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
        <TrendingUp size={32} color="var(--accent-primary)" />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, color:"var(--text-muted)", marginBottom:6 }}>Tingkat Kehadiran Keseluruhan</div>
          <div className="progress-bar" style={{ width:"100%", maxWidth:400 }}>
            <div className="progress-fill" style={{ width:`${stats.attendanceRate}%` }} />
          </div>
        </div>
        <div style={{ fontSize:40, fontWeight:900 }} className="gradient-text">{stats.attendanceRate}%</div>
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, marginBottom:24 }}>
        {/* Bar chart */}
        <div className="glass-card" style={{ padding:24 }}>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
            <BarChart3 size={18} color="var(--accent-primary)" /> Kehadiran 7 Hari Terakhir
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill:"var(--text-muted)", fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"var(--text-muted)", fontSize:12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:"#0f1629", border:"1px solid var(--border-glass)", borderRadius:10 }}
                labelStyle={{ color:"var(--text-primary)" }} />
              <Bar dataKey="hadir"       name="Hadir"       fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="terlambat"   name="Terlambat"   fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass-card" style={{ padding:24 }}>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Status Hari Ini</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:"#0f1629", border:"1px solid var(--border-glass)", borderRadius:10 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:COLORS[i] }} />
                  <span style={{ color:"var(--text-muted)" }}>{d.name}</span>
                </div>
                <span style={{ fontWeight:600 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent attendance */}
      <div className="glass-card" style={{ padding:24, marginBottom:24 }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
          <Calendar size={18} color="var(--accent-primary)" /> Absensi Terbaru Hari Ini
        </div>
        {todayRecords.length === 0 ? (
          <div style={{ textAlign:"center", color:"var(--text-muted)", padding:"32px 0", fontSize:14 }}>
            Belum ada data absensi hari ini
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Siswa</th><th>Kelas</th><th>Jam Masuk</th><th>Status</th>
                  <th>Verif Wajah</th><th>Verif Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.slice(0, 8).map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight:500, color:"var(--text-primary)" }}>{r.studentName}</td>
                    <td>{r.kelas}</td>
                    <td>{r.checkIn?.time ?? "–"}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>{r.checkIn?.faceVerified
                      ? <span style={{ color:"#10b981" }}>✓ Terverifikasi</span>
                      : <span style={{ color:"var(--text-muted)" }}>–</span>}
                    </td>
                    <td>{r.checkIn?.locationVerified
                      ? <span style={{ color:"#10b981" }}>✓ Dalam zona</span>
                      : <span style={{ color:"var(--text-muted)" }}>–</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent notifications */}
      <div className="glass-card" style={{ padding:24 }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
          <Bell size={18} color="var(--accent-primary)" /> Log Notifikasi Terbaru
        </div>
        {notifications.slice(0, 5).map((n) => (
          <div key={n.id} style={{ display:"flex", alignItems:"flex-start", gap:12,
            padding:"12px 0", borderBottom:"1px solid var(--border-glass)" }}>
            <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
              background:"rgba(245,158,11,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <AlertTriangle size={16} color="#f59e0b" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, color:"var(--text-primary)", lineHeight:1.5 }}>{n.message}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4, display:"flex", gap:12 }}>
                <span>{new Date(n.sentAt).toLocaleString("id-ID")}</span>
                <span style={{ color: n.status === "sent" ? "#10b981" : "#ef4444" }}>
                  {n.status === "sent" ? "✓ Terkirim" : "✗ Gagal"}
                </span>
                <span style={{ textTransform:"capitalize" }}>{n.type}</span>
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div style={{ textAlign:"center", color:"var(--text-muted)", padding:"24px 0", fontSize:14 }}>
            Belum ada notifikasi
          </div>
        )}
      </div>
    </div>
  );
}
