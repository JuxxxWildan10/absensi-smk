"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Search, Download, FileText } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function GuruReportsPage() {
  const { records, currentUser } = useStore();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const teacher = currentUser as import("@/lib/types").Teacher;
  const myKelas = teacher?.kelasWali ?? "";

  const filtered = records.filter((r) => {
    if (r.kelas !== myKelas) return false;
    const matchSearch = r.studentName.toLowerCase().includes(search.toLowerCase());
    const matchFrom   = !dateFrom || r.date >= dateFrom;
    const matchTo     = !dateTo   || r.date <= dateTo;
    return matchSearch && matchFrom && matchTo;
  });

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Laporan Absensi</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Kelas {myKelas}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => exportToPDF(filtered, `Laporan ${myKelas}`)} className="btn-secondary" style={{ fontSize: 13 }}>
            <FileText size={15} /> PDF
          </button>
          <button onClick={() => exportToExcel(filtered, `Laporan ${myKelas}`)} className="btn-primary" style={{ fontSize: 13 }}>
            <Download size={15} /> Excel
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input className="input-field" style={{ paddingLeft: 36 }}
              placeholder="Cari siswa..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <input className="input-field" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ colorScheme: "dark" }} />
          <input className="input-field" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ colorScheme: "dark" }} />
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>Tanggal</th><th>Nama Siswa</th><th>Status</th><th>Jam Masuk</th><th>Jam Keluar</th></tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{format(new Date(r.date), "dd MMM yyyy", { locale: idLocale })}</td>
                  <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{r.studentName}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.checkIn?.time ?? "–"}</td>
                  <td>{r.checkOut?.time ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>Tidak ada data laporan ditemukan.</div>
        )}
      </div>
    </div>
  );
}
