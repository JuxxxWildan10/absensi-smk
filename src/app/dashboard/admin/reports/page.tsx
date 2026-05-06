"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Download, Filter, Search, FileText } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function AdminReportsPage() {
  const { records, students } = useStore();
  const [search, setSearch]       = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");

  const classes = [...new Set(students.map((s) => s.kelas))];

  const filtered = records.filter((r) => {
    const matchSearch = r.studentName.toLowerCase().includes(search.toLowerCase());
    const matchKelas  = kelasFilter === "all" || r.kelas === kelasFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchFrom   = !dateFrom || r.date >= dateFrom;
    const matchTo     = !dateTo   || r.date <= dateTo;
    return matchSearch && matchKelas && matchStatus && matchFrom && matchTo;
  });

  return (
    <div className="animate-fadeIn">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:16 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800 }}>Laporan Absensi</h1>
          <p style={{ color:"var(--text-muted)", fontSize:14 }}>{filtered.length} rekord ditemukan</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => exportToPDF(filtered)} className="btn-secondary" style={{ fontSize:13 }}>
            <FileText size={15} /> Export PDF
          </button>
          <button onClick={() => exportToExcel(filtered)} className="btn-primary" style={{ fontSize:13 }}>
            <Download size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding:20, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, color:"var(--text-secondary)", fontSize:14, fontWeight:600 }}>
          <Filter size={15} /> Filter Data
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
          <div style={{ position:"relative" }}>
            <Search size={14} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
            <input className="input-field" style={{ paddingLeft:36 }}
              placeholder="Cari siswa..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input-field" value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)}>
            <option value="all">Semua Kelas</option>
            {classes.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="hadir">Hadir</option>
            <option value="terlambat">Terlambat</option>
            <option value="tidak_hadir">Tidak Hadir</option>
            <option value="izin">Izin</option>
            <option value="sakit">Sakit</option>
          </select>
          <input className="input-field" type="date" value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)} style={{ colorScheme:"dark" }} />
          <input className="input-field" type="date" value={dateTo}
            onChange={(e) => setDateTo(e.target.value)} style={{ colorScheme:"dark" }} />
        </div>
      </div>

      <div className="glass-card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th><th>Nama Siswa</th><th>Kelas</th><th>Status</th>
                <th>Jam Masuk</th><th>Jam Keluar</th><th>Wajah</th><th>Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace:"nowrap" }}>
                    {format(new Date(r.date), "dd MMM yyyy", { locale: idLocale })}
                  </td>
                  <td style={{ fontWeight:500, color:"var(--text-primary)" }}>{r.studentName}</td>
                  <td>{r.kelas}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.checkIn?.time ?? "–"}</td>
                  <td>{r.checkOut?.time ?? "–"}</td>
                  <td style={{ color: r.checkIn?.faceVerified ? "#10b981" : "var(--text-muted)" }}>
                    {r.checkIn?.faceVerified ? "✓" : "–"}
                  </td>
                  <td style={{ color: r.checkIn?.locationVerified ? "#10b981" : "var(--text-muted)" }}>
                    {r.checkIn?.locationVerified ? "✓" : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div style={{ padding:"12px 20px", fontSize:13, color:"var(--text-muted)", textAlign:"center",
            borderTop:"1px solid var(--border-glass)" }}>
            Menampilkan 100 dari {filtered.length} rekord. Export untuk data lengkap.
          </div>
        )}
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"48px 0", color:"var(--text-muted)" }}>
            Tidak ada data ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
