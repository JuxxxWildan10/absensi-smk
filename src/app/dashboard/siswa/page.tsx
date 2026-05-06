"use client";
import { useStore } from "@/lib/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CheckCircle, Clock, UserX, TrendingUp, Calendar, BarChart3, FileText,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { AttendanceRecord } from "@/lib/types";

// Komponen Utama: Halaman Dashboard Siswa
// Menampilkan ringkasan kehadiran pribadi, grafik 14 hari terakhir, dan riwayat absen terbaru
export default function SiswaDashboard() {
  // Mengambil state dan fungsi dari global store
  const { currentUser, getStudentAttendance } = useStore();
  // State untuk menyimpan data absen siswa yang sedang login
  const [records, setRecords] = useState<AttendanceRecord[]>([]); 
  const [mounted, setMounted] = useState(false);

  // Effect untuk memuat data absensi siswa saat komponen di-render
  useEffect(() => {
    if (currentUser) {
      setRecords(getStudentAttendance(currentUser.id));
    }
    setMounted(true);
  }, [currentUser, getStudentAttendance]);

  const today = new Date().toISOString().split("T")[0];

  // Mengkalkulasi statistik kehadiran secara efisien menggunakan useMemo (menghindari render ulang yang tidak perlu)
  const stats = useMemo(() => {
    // Mencari data absen khusus hari ini
    const todayRecord = records.find((r) => r.date === today);
    const total  = records.length;
    const hadir  = records.filter((r) => r.status === "hadir").length;
    const telat  = records.filter((r) => r.status === "terlambat").length;
    const absen  = records.filter((r) => r.status === "tidak_hadir").length;
    const rate   = total > 0 ? Math.round(((hadir + telat) / total) * 100) : 0;
    return { todayRecord, total, hadir, telat, absen, rate };
  }, [records, today]);

  // Menyiapkan data untuk grafik garis (tren kehadiran 14 hari terakhir)
  const chartData = useMemo(() => {
    // Membangun Map berdasarkan tanggal untuk pencarian O(1) yang cepat
    const recordMap = new Map(records.map((r) => [r.date, r]));
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const rec = recordMap.get(ds);
      data.push({
        day: format(d, "dd/MM"),
        status: rec ? (rec.status === "hadir" ? 1 : rec.status === "terlambat" ? 0.5 : 0) : null,
      });
    }
    return data;
  }, [records]);

  if (!currentUser || !mounted) return null;

  const { todayRecord, hadir, telat, absen, rate } = stats;

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>
          Selamat Datang, {currentUser.name.split(" ")[0]} 👋
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          {format(new Date(), "EEEE, dd MMMM yyyy", { locale: idLocale })}
        </p>
      </div>

      {/* Today status card - Kartu dinamis yang berubah warna berdasarkan status absen hari ini */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24,
        background: todayRecord
          ? todayRecord.status === "hadir" ? "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))"
            : todayRecord.status === "terlambat" ? "linear-gradient(135deg,rgba(245,158,11,0.12),rgba(217,119,6,0.06))"
            : "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(220,38,38,0.06))"
          : "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.06))",
        border: todayRecord
          ? todayRecord.status === "hadir" ? "1px solid rgba(16,185,129,0.25)"
            : todayRecord.status === "terlambat" ? "1px solid rgba(245,158,11,0.25)"
            : "1px solid rgba(239,68,68,0.25)"
          : "1px solid rgba(99,102,241,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Status Kehadiran Hari Ini</div>
            {todayRecord ? (
              <>
                <StatusBadge status={todayRecord.status} />
                {todayRecord.checkIn && (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
                    Check-in: <strong>{todayRecord.checkIn.time}</strong>
                    {todayRecord.checkOut && <> &nbsp;| Check-out: <strong>{todayRecord.checkOut.time}</strong></>}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-primary)", marginTop: 4 }}>
                Belum Absen
              </div>
            )}
          </div>
          {!todayRecord && (
            <Link href="/dashboard/siswa/absensi" className="btn-primary">
              Lakukan Absensi Sekarang →
            </Link>
          )}
          {todayRecord && !todayRecord.checkOut && (
            <Link href="/dashboard/siswa/absensi" className="btn-secondary">
              Check-Out →
            </Link>
          )}
        </div>
      </div>

      {/* Stats - Kartu ringkasan jumlah hadir, terlambat, alpa, dan persentase keseluruhan */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Hadir", value: hadir,  icon: CheckCircle, color: "#10b981", type: "success" },
          { label: "Terlambat", value: telat, icon: Clock,   color: "#f59e0b", type: "warning" },
          { label: "Tidak Hadir", value: absen,icon: UserX,  color: "#ef4444", type: "danger"  },
          { label: "Tingkat Hadir", value: `${rate}%`, icon: TrendingUp, color: "#6366f1", type: "primary" },
        ].map((card) => (
          <div key={card.label} className={`stat-card ${card.type}`}>
            <card.icon size={20} color={card.color} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 28, fontWeight: 800 }}>{card.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Chart - Grafik garis yang memvisualisasikan kehadiran 14 hari terakhir */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 size={18} color="var(--accent-primary)" /> Kehadiran 14 Hari Terakhir
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 1]} />
            <Tooltip contentStyle={{ background: "#0f1629", border: "1px solid var(--border-glass)", borderRadius: 10 }}
              formatter={(val) => {
                const n = typeof val === "number" ? val : null;
                return n === 1 ? "Hadir" : n === 0.5 ? "Terlambat" : "Tidak Hadir";
              }} />
            <Line type="monotone" dataKey="status" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent records - Tabel yang menampilkan 10 riwayat absensi paling baru */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} color="var(--accent-primary)" /> Riwayat Absensi Terbaru
          </span>
          {records.length > 10 && (
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>
              Menampilkan 10 dari {records.length} data
            </span>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>Tanggal</th><th>Status</th><th>Jam Masuk</th><th>Jam Keluar</th><th>Verifikasi</th></tr>
            </thead>
            <tbody>
              {records.slice(0, 10).map((r) => (
                <tr key={r.id}>
                  <td>{format(new Date(r.date), "EEE, dd MMM yyyy", { locale: idLocale })}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.checkIn?.time ?? "–"}</td>
                  <td>{r.checkOut?.time ?? "–"}</td>
                  <td style={{ fontSize: 12 }}>
                    {r.checkIn
                      ? <span style={{ color: "#10b981" }}>✓ Wajah & GPS</span>
                      : <span style={{ color: "var(--text-muted)" }}>–</span>}
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
