"use client";
import { useStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { BarChart3, Download, TrendingUp, TrendingDown, Award, AlertTriangle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import StatusBadge from "@/components/StatusBadge";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Attendance heatmap component
function AttendanceHeatmap({ records, studentId }: { records: import("@/lib/types").AttendanceRecord[], studentId: string }) {
  const studentRecords = records.filter(r => r.studentId === studentId);
  const days: { date: string; status: string | null }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const ds = d.toISOString().split("T")[0];
    const rec = studentRecords.find(r => r.date === ds);
    days.push({ date: ds, status: rec?.status ?? null });
  }

  const getColor = (status: string | null) => {
    if (!status) return "rgba(255,255,255,0.05)";
    if (status === "hadir") return "#10b981";
    if (status === "terlambat") return "#f59e0b";
    if (status === "sakit") return "#3b82f6";
    if (status === "izin") return "#8b5cf6";
    return "#ef4444";
  };

  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {days.map(d => (
        <div key={d.date} title={`${d.date}: ${d.status ?? "–"}`}
          style={{ width: 14, height: 14, borderRadius: 3, background: getColor(d.status), transition: "transform 0.1s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.3)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        />
      ))}
    </div>
  );
}

export default function AdminRekapPage() {
  const { records, students, classes, updateAttendance } = useStore();
  const [selectedKelas, setSelectedKelas] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [rekapPage, setRekapPage] = useState(1);
  const [editingStudent, setEditingStudent] = useState<{ id: string, name: string } | null>(null);
  const REKAP_PAGE_SIZE = 25;

  const filterStudents = useMemo(
    () => selectedKelas === "all" ? students : students.filter(s => s.kelas === selectedKelas),
    [students, selectedKelas]
  );

  const parseMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    return { year, month };
  };

  const getMonthRecords = (studentId: string) => {
    const { year, month } = parseMonth(selectedMonth);
    return records.filter(r => {
      const d = new Date(r.date);
      return r.studentId === studentId && d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  };

  // Trend data — last 6 months
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  });
  const trendData = last6Months.map(m => {
    const recs = records.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth() &&
        (selectedKelas === "all" || r.kelas === selectedKelas);
    });
    const total = recs.length;
    const present = recs.filter(r => r.status === "hadir" || r.status === "terlambat").length;
    return {
      bulan: format(m, "MMM", { locale: idLocale }),
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
      hadir: recs.filter(r => r.status === "hadir").length,
      terlambat: recs.filter(r => r.status === "terlambat").length,
      absen: recs.filter(r => r.status === "tidak_hadir").length,
    };
  });

  const studentSummaries = useMemo(() => filterStudents.map(s => {
    const recs = getMonthRecords(s.id);
    const hadir = recs.filter(r => r.status === "hadir").length;
    const terlambat = recs.filter(r => r.status === "terlambat").length;
    const sakit = recs.filter(r => r.status === "sakit").length;
    const izin = recs.filter(r => r.status === "izin").length;
    const alpa = recs.filter(r => r.status === "tidak_hadir").length;
    const total = recs.length;
    const rate = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0;
    return { student: s, hadir, terlambat, sakit, izin, alpa, total, rate };
  }).sort((a, b) => b.rate - a.rate), [filterStudents, selectedMonth, records]);

  const pagedSummaries = useMemo(() => {
    const start = (rekapPage - 1) * REKAP_PAGE_SIZE;
    return studentSummaries.slice(start, start + REKAP_PAGE_SIZE);
  }, [studentSummaries, rekapPage]);

  const totalRekapPages = Math.max(1, Math.ceil(studentSummaries.length / REKAP_PAGE_SIZE));

  const avgRate = studentSummaries.length > 0
    ? Math.round(studentSummaries.reduce((s, x) => s + x.rate, 0) / studentSummaries.length)
    : 0;

  const belowThreshold = studentSummaries.filter(s => s.rate < 75);
  const topStudents = studentSummaries.slice(0, 3);

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Rekap & Analitik Kehadiran</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Analisis mendalam tingkat kehadiran per siswa dan kelas.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select className="input-field" value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
            style={{ width: "auto", colorScheme: "dark" }}>
            <option value="all">Semua Kelas</option>
            {classes.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <input type="month" className="input-field" value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)} style={{ width: "auto", colorScheme: "dark" }} />
        </div>
      </div>

      {/* Overview stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Rata-rata Kehadiran", value: `${avgRate}%`, icon: TrendingUp, color: "#10b981", type: "success" },
          { label: "Total Siswa", value: filterStudents.length, icon: BarChart3, color: "#6366f1", type: "primary" },
          { label: "Di Bawah 75%", value: belowThreshold.length, icon: AlertTriangle, color: "#ef4444", type: "danger" },
          { label: "Siswa Rajin (≥90%)", value: studentSummaries.filter(s => s.rate >= 90).length, icon: Award, color: "#f59e0b", type: "warning" },
        ].map(c => (
          <div key={c.label} className={`stat-card ${c.type}`}>
            <c.icon size={20} color={c.color} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 30, fontWeight: 800 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Alert: below threshold */}
      {belowThreshold.length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>
              ⚠️ {belowThreshold.length} Siswa dengan Kehadiran di Bawah 75%
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {belowThreshold.map(s => s.student.name).join(", ")}
            </div>
          </div>
        </div>
      )}

      {/* Trend chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={18} color="var(--accent-primary)" /> Tren Kehadiran 6 Bulan
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="bulan" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#0f1629", border: "1px solid var(--border-glass)", borderRadius: 10 }}
                formatter={(val: any) => [`${val}%`, "Tingkat Kehadiran"]} />
              <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={18} color="var(--accent-primary)" /> Detail Bulanan
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="bulan" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f1629", border: "1px solid var(--border-glass)", borderRadius: 10 }} />
              <Bar dataKey="hadir" name="Hadir" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="terlambat" name="Terlambat" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="absen" name="Alpa" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance Heatmap per student */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={18} color="var(--accent-primary)" /> Heatmap Kehadiran (90 Hari Terakhir)
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Hover pada kotak untuk detail tanggal dan status kehadiran.
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { color: "#10b981", label: "Hadir" },
            { color: "#f59e0b", label: "Terlambat" },
            { color: "#3b82f6", label: "Sakit" },
            { color: "#8b5cf6", label: "Izin" },
            { color: "#ef4444", label: "Alpa" },
            { color: "rgba(255,255,255,0.05)", label: "Tidak ada data" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color }} />
              <span style={{ color: "var(--text-muted)" }}>{l.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filterStudents.slice(0, 6).map(s => (
            <div key={s.id}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>{s.name}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.kelas}</span>
              </div>
              <AttendanceHeatmap records={records} studentId={s.id} />
            </div>
          ))}
        </div>
      </div>

      {/* Monthly per-student table */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span>Rekap Bulanan per Siswa — {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: idLocale })}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Hadir</th>
                <th>Terlambat</th>
                <th>Sakit</th>
                <th>Izin</th>
                <th>Alpa</th>
                <th>% Kehadiran</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedSummaries.map((s, i) => {
                const globalIdx = (rekapPage - 1) * REKAP_PAGE_SIZE + i;
                return (
                  <tr key={s.student.id}>
                    <td style={{ color: globalIdx < 3 ? "#f59e0b" : "var(--text-muted)", fontWeight: 600 }}>
                      {globalIdx < 3 ? ["🥇", "🥈", "🥉"][globalIdx] : globalIdx + 1}
                    </td>
                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{s.student.name}</td>
                    <td>{s.student.kelas}</td>
                    <td style={{ color: "#10b981", fontWeight: 600 }}>{s.hadir}</td>
                    <td style={{ color: "#f59e0b", fontWeight: 600 }}>{s.terlambat}</td>
                    <td style={{ color: "#3b82f6" }}>{s.sakit}</td>
                    <td style={{ color: "#8b5cf6" }}>{s.izin}</td>
                    <td style={{ color: "#ef4444", fontWeight: 600 }}>{s.alpa}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "var(--border-glass)", borderRadius: 3, overflow: "hidden", minWidth: 60 }}>
                          <div style={{ height: "100%", width: `${s.rate}%`, borderRadius: 3,
                            background: s.rate >= 90 ? "#10b981" : s.rate >= 75 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700,
                          color: s.rate >= 90 ? "#10b981" : s.rate >= 75 ? "#f59e0b" : "#ef4444" }}>
                          {s.rate}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <button onClick={() => setEditingStudent({ id: s.student.id, name: s.student.name })}
                        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                        Detail & Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Rekap Pagination */}
        {studentSummaries.length > REKAP_PAGE_SIZE && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 0", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {(rekapPage - 1) * REKAP_PAGE_SIZE + 1}–{Math.min(rekapPage * REKAP_PAGE_SIZE, studentSummaries.length)} dari {studentSummaries.length} siswa
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setRekapPage(p => Math.max(1, p - 1))} disabled={rekapPage === 1}
                style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 10px", cursor: rekapPage === 1 ? "not-allowed" : "pointer", opacity: rekapPage === 1 ? 0.4 : 1, color: "var(--text-secondary)" }}>
                <ChevronLeft size={15} />
              </button>
              <span style={{ padding: "6px 14px", background: "var(--gradient-primary)", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "white" }}>{rekapPage}</span>
              <button onClick={() => setRekapPage(p => Math.min(totalRekapPages, p + 1))} disabled={rekapPage === totalRekapPages}
                style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 10px", cursor: rekapPage === totalRekapPages ? "not-allowed" : "pointer", opacity: rekapPage === totalRekapPages ? 0.4 : 1, color: "var(--text-secondary)" }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editing Modal */}
      {editingStudent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-card" style={{ width: 600, padding: 28, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                Detail Kehadiran: <span className="gradient-text">{editingStudent.name}</span>
              </h2>
              <button onClick={() => setEditingStudent(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>Tutup</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: 8 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jam Masuk</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getMonthRecords(editingStudent.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => (
                    <tr key={r.id}>
                      <td style={{ fontSize: 13 }}>{format(new Date(r.date), "dd MMM yyyy", { locale: idLocale })}</td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{r.checkIn?.time || "-"}</td>
                      <td>
                        <select className="input-field" value={r.status} onChange={e => updateAttendance(r.id, { status: e.target.value as any })} style={{ padding: "4px 8px", height: "auto", fontSize: 13, width: 140 }}>
                          <option value="hadir">Hadir</option>
                          <option value="terlambat">Terlambat</option>
                          <option value="sakit">Sakit</option>
                          <option value="izin">Izin</option>
                          <option value="tidak_hadir">Alpa</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {getMonthRecords(editingStudent.id).length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px 0" }}>Tidak ada data di bulan ini</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
