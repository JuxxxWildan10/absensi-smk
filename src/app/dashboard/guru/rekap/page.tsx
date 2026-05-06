"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { BarChart3, TrendingUp, Award, AlertTriangle, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { format, subMonths, eachMonthOfInterval } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Komponen MiniHeatmap: Visualisasi riwayat kehadiran dalam bentuk kotak warna-warni (heatmap)
// Memudahkan guru melihat pola kehadiran siswa selama 60 hari terakhir
function MiniHeatmap({ records, studentId }: { records: import("@/lib/types").AttendanceRecord[], studentId: string }) {
  // Filter rekor absensi khusus untuk siswa yang dipilih
  const studentRecords = records.filter(r => r.studentId === studentId);
  const days: { date: string; status: string | null }[] = [];
  for (let i = 59; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const ds = d.toISOString().split("T")[0];
    const rec = studentRecords.find(r => r.date === ds);
    days.push({ date: ds, status: rec?.status ?? null });
  }
  // Fungsi penentuan warna kotak berdasarkan status absensi
  const getColor = (s: string | null) => {
    if (!s) return "rgba(255,255,255,0.05)";
    if (s === "hadir") return "#10b981";
    if (s === "terlambat") return "#f59e0b";
    if (s === "sakit" || s === "izin") return "#3b82f6";
    return "#ef4444";
  };
  return (
    <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {days.map(d => (
        <div key={d.date} title={`${d.date}: ${d.status ?? "–"}`}
          style={{ width: 10, height: 10, borderRadius: 2, background: getColor(d.status) }} />
      ))}
    </div>
  );
}

// Komponen Utama: Halaman Rekap Kehadiran untuk Guru
// Menampilkan analitik, grafik tren, dan tabel detail kehadiran siswa di kelas yang diampu
export default function GuruRekapPage() {
  // Mengambil state global: data user login, semua rekor absen, dan semua data siswa
  const { currentUser, records, students } = useStore();
  // State untuk menyimpan filter bulan (default ke bulan ini)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  if (!currentUser) return null;

  // Melakukan filter untuk mendapatkan data siswa yang HANYA berada di kelas guru tersebut
  const teacher = currentUser as import("@/lib/types").Teacher;
  const myKelas = teacher.kelasWali || "";
  const myStudents = students.filter(s => s.kelas === myKelas);

  // Fungsi utilitas untuk memecah string bulan (YYYY-MM) menjadi tahun dan bulan numerik
  const parseMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    return { year, month };
  };

  // Fungsi untuk mengambil rekor absensi seorang siswa pada bulan yang sedang dipilih
  const getMonthRecords = (studentId: string) => {
    const { year, month } = parseMonth(selectedMonth);
    return records.filter(r => {
      const d = new Date(r.date);
      return r.studentId === studentId && d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  };

  // Mengkalkulasi tren kehadiran kelas selama 6 bulan terakhir untuk keperluan grafik garis/batang
  const last6 = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
  const trendData = last6.map(m => {
    // Filter rekor absen di bulan spesifik untuk kelas guru ini
    const recs = records.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth() && r.kelas === myKelas;
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

  // Mengkalkulasi ringkasan / statistik kehadiran untuk setiap siswa di kelas
  const summaries = myStudents.map(s => {
    const recs = getMonthRecords(s.id);
    const hadir = recs.filter(r => r.status === "hadir").length;
    const terlambat = recs.filter(r => r.status === "terlambat").length;
    const sakit = recs.filter(r => r.status === "sakit").length;
    const izin = recs.filter(r => r.status === "izin").length;
    const alpa = recs.filter(r => r.status === "tidak_hadir").length;
    const total = recs.length;
    const rate = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0;
    return { student: s, hadir, terlambat, sakit, izin, alpa, total, rate };
  }).sort((a, b) => b.rate - a.rate);

  // Menghitung rata-rata tingkat kehadiran seluruh kelas
  const avgRate = summaries.length > 0
    ? Math.round(summaries.reduce((s, x) => s + x.rate, 0) / summaries.length)
    : 0;

  // Mendapatkan daftar siswa yang butuh perhatian (kehadiran di bawah batas 75%)
  const belowThreshold = summaries.filter(s => s.rate < 75);

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Rekap Kehadiran Kelas</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Kelas: <strong style={{ color: "var(--text-primary)" }}>{myKelas || "–"}</strong></p>
        </div>
        <input type="month" className="input-field" value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)} style={{ width: "auto", colorScheme: "dark" }} />
      </div>

      {/* Stats - Kartu ringkasan statistik (Rata-rata, Total Siswa, Peringatan) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Rata-rata Kehadiran", value: `${avgRate}%`, color: "#10b981", type: "success" },
          { label: "Total Siswa", value: myStudents.length, color: "#6366f1", type: "primary" },
          { label: "Di Bawah 75%", value: belowThreshold.length, color: "#ef4444", type: "danger" },
          { label: "Kehadiran Penuh", value: summaries.filter(s => s.rate >= 90).length, color: "#f59e0b", type: "warning" },
        ].map(c => (
          <div key={c.label} className={`stat-card ${c.type}`}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {belowThreshold.length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <AlertTriangle size={20} color="#ef4444" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", marginBottom: 2 }}>
              {belowThreshold.length} siswa kehadiran di bawah 75%
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {belowThreshold.map(s => s.student.name).join(", ")}
            </div>
          </div>
        </div>
      )}

      {/* Chart - Menampilkan grafik Garis (Tren) dan grafik Batang (Detail per bulan) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={18} color="var(--accent-primary)" /> Tren Kehadiran 6 Bulan
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="bulan" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#0f1629", border: "1px solid var(--border-glass)", borderRadius: 10 }}
                formatter={(val) => {
                  const n = typeof val === "number" ? val : 0;
                  return [`${n}%`, "Tingkat Kehadiran"];
                }} />
              <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={18} color="var(--accent-primary)" /> Detail per Bulan
          </div>
          <ResponsiveContainer width="100%" height={180}>
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

      {/* Heatmap - Visualisasi riwayat 60 hari terakhir setiap siswa */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={18} color="var(--accent-primary)" /> Heatmap Kehadiran (60 Hari Terakhir)
        </div>
        <div style={{ display: "flex", gap: 8, fontSize: 11, marginBottom: 12, flexWrap: "wrap" }}>
          {[{ c: "#10b981", l: "Hadir" }, { c: "#f59e0b", l: "Terlambat" }, { c: "#3b82f6", l: "Izin/Sakit" }, { c: "#ef4444", l: "Alpa" }, { c: "rgba(255,255,255,0.05)", l: "Tidak ada" }].map(i => (
            <div key={i.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: i.c }} />
              <span style={{ color: "var(--text-muted)" }}>{i.l}</span>
            </div>
          ))}
        </div>
        {myStudents.map(s => (
          <div key={s.id} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
              <span>{s.name}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {summaries.find(x => x.student.id === s.id)?.rate ?? 0}%
              </span>
            </div>
            <MiniHeatmap records={records} studentId={s.id} />
          </div>
        ))}
      </div>

      {/* Table - Tabel rekap detail bulan ini dengan peringkat (ranking) dan bar persentase */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          Rekap Bulanan — {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: idLocale })}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Nama Siswa</th><th>Hadir</th><th>Terlambat</th><th>Sakit</th><th>Izin</th><th>Alpa</th><th>% Kehadiran</th></tr>
            </thead>
            <tbody>
              {summaries.map((s, i) => (
                <tr key={s.student.id}>
                  <td style={{ color: i < 3 ? "#f59e0b" : "var(--text-muted)", fontWeight: 600 }}>
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </td>
                  <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{s.student.name}</td>
                  <td style={{ color: "#10b981", fontWeight: 600 }}>{s.hadir}</td>
                  <td style={{ color: "#f59e0b", fontWeight: 600 }}>{s.terlambat}</td>
                  <td style={{ color: "#3b82f6" }}>{s.sakit}</td>
                  <td style={{ color: "#8b5cf6" }}>{s.izin}</td>
                  <td style={{ color: "#ef4444", fontWeight: 600 }}>{s.alpa}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--border-glass)", borderRadius: 3, overflow: "hidden", minWidth: 50 }}>
                        <div style={{ height: "100%", width: `${s.rate}%`, borderRadius: 3,
                          background: s.rate >= 90 ? "#10b981" : s.rate >= 75 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700,
                        color: s.rate >= 90 ? "#10b981" : s.rate >= 75 ? "#f59e0b" : "#ef4444" }}>
                        {s.rate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
