"use client";
import { useStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { User, TrendingUp, CheckCircle, Clock, UserX, Calendar } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Komponen Utama: Halaman Data Anak untuk Wali Murid
// Menampilkan profil lengkap, statistik kehadiran, dan riwayat absen dari masing-masing anak
export default function WaliAnakPage() {
  // Mengambil state global untuk informasi login, data rekam absen, orang tua, dan siswa
  const { currentUser, records, parents, students } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!currentUser || !mounted) return null;

  // Mencari data spesifik wali murid yang sedang login
  const parent = parents.find(p => p.id === currentUser.id);
  const studentIds = parent?.studentIds ?? [];
  // Mengambil data siswa (anak) yang memiliki relasi dengan wali murid ini
  const myStudents = students.filter(s => studentIds.includes(s.id));

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Data Anak Saya</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Informasi lengkap profil dan kehadiran anak Anda.</p>
      </div>

      {myStudents.map(student => {
        // Mengambil dan mengurutkan riwayat absen anak ini (terbaru di atas)
        const studentRecords = records.filter(r => r.studentId === student.id)
          .sort((a, b) => b.date.localeCompare(a.date));

        // Mengkalkulasi statistik kehadiran anak
        const hadir = studentRecords.filter(r => r.status === "hadir").length;
        const terlambat = studentRecords.filter(r => r.status === "terlambat").length;
        const sakit = studentRecords.filter(r => r.status === "sakit").length;
        const izin = studentRecords.filter(r => r.status === "izin").length;
        const alpa = studentRecords.filter(r => r.status === "tidak_hadir").length;
        const total = studentRecords.length;
        const rate = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0;

        // Menyiapkan data untuk Grafik Tren Kehadiran (14 hari terakhir)
        const chartData = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const ds = d.toISOString().split("T")[0];
          const rec = studentRecords.find(r => r.date === ds);
          chartData.push({
            day: format(d, "dd/MM"),
            status: rec ? (rec.status === "hadir" ? 1 : rec.status === "terlambat" ? 0.5 : 0) : null,
          });
        }

        // Memeriksa status absen anak hari ini
        const today = new Date().toISOString().split("T")[0];
        const todayRec = studentRecords.find(r => r.date === today);

        return (
          <div key={student.id} style={{ marginBottom: 32 }}>
            {/* Student profile card - Menampilkan foto, nama, kelas, jurusan, dan status absen hari ini */}
            <div className="glass-card" style={{ padding: 28, marginBottom: 20,
              background: "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--gradient-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "white", flexShrink: 0 }}>
                  {student.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{student.name}</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[
                      { label: "NISN", value: student.nisn },
                      { label: "Kelas", value: student.kelas },
                      { label: "Jurusan", value: student.jurusan },
                    ].map(i => (
                      <div key={i.label} style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {i.label}: <strong style={{ color: "var(--text-primary)" }}>{i.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Status Hari Ini</div>
                  {todayRec ? <StatusBadge status={todayRec.status} /> : <span className="badge badge-danger">Belum Absen</span>}
                </div>
              </div>
            </div>

            {/* Stats - Kartu ringkasan jumlah hadir, terlambat, sakit, izin, alpa */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Hadir", value: hadir, color: "#10b981", type: "success" },
                { label: "Terlambat", value: terlambat, color: "#f59e0b", type: "warning" },
                { label: "Sakit", value: sakit, color: "#3b82f6", type: "primary" },
                { label: "Izin", value: izin, color: "#8b5cf6", type: "primary" },
                { label: "Alpa", value: alpa, color: "#ef4444", type: "danger" },
                { label: "Kehadiran", value: `${rate}%`, color: rate >= 75 ? "#10b981" : "#ef4444", type: rate >= 75 ? "success" : "danger" },
              ].map(c => (
                <div key={c.label} className={`stat-card ${c.type}`} style={{ padding: 16 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar - Visualisasi tingkat kehadiran beserta peringatan jika di bawah batas minimum (75%) */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Tingkat Kehadiran Keseluruhan</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: rate >= 75 ? "#10b981" : "#ef4444" }}>{rate}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${rate}%`, background: rate >= 75 ? "var(--gradient-success)" : "var(--gradient-danger)" }} />
              </div>
              {rate < 75 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>
                  ⚠️ Kehadiran di bawah 75% — batas minimum yang ditetapkan sekolah
                </div>
              )}
            </div>

            {/* Trend chart - Grafik garis visualisasi riwayat 14 hari terakhir */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Kehadiran 14 Hari Terakhir</div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 1]} />
                  <Tooltip contentStyle={{ background: "#0f1629", border: "1px solid var(--border-glass)", borderRadius: 10 }}
                    formatter={(val) => {
                      const n = typeof val === "number" ? val : null;
                      return n === 1 ? "Hadir" : n === 0.5 ? "Terlambat" : "Tidak Hadir";
                    }} />
                  <Line type="monotone" dataKey="status" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent records - Tabel riwayat absensi terbaru (maksimal 10 data) */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={18} color="var(--accent-primary)" /> Riwayat Terbaru
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Tanggal</th><th>Status</th><th>Jam Masuk</th><th>Jam Keluar</th><th>Verifikasi</th></tr>
                  </thead>
                  <tbody>
                    {studentRecords.slice(0, 10).map(r => (
                      <tr key={r.id}>
                        <td style={{ whiteSpace: "nowrap" }}>{format(new Date(r.date), "EEE, dd MMM yyyy", { locale: idLocale })}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>{r.checkIn?.time ?? "–"}</td>
                        <td>{r.checkOut?.time ?? "–"}</td>
                        <td style={{ fontSize: 12 }}>
                          {r.checkIn ? <span style={{ color: "#10b981" }}>✓ Wajah & GPS</span> : <span style={{ color: "var(--text-muted)" }}>–</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
