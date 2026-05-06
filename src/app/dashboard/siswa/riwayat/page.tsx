"use client";
import { useStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { Search, Download } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function SiswaRiwayatPage() {
  const { currentUser, getStudentAttendance } = useStore();
  const [statusFilter, setStatusFilter] = useState("all");

  if (!currentUser) return null;
  const records = getStudentAttendance(currentUser.id);

  const filtered = records.filter((r) =>
    statusFilter === "all" || r.status === statusFilter
  );

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Reset pagination when filter changes
  useEffect(() => { setCurrentPage(1); }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const hadir  = records.filter((r) => r.status === "hadir").length;
  const telat  = records.filter((r) => r.status === "terlambat").length;
  const absen  = records.filter((r) => r.status === "tidak_hadir").length;
  const rate   = records.length > 0 ? Math.round(((hadir + telat) / records.length) * 100) : 0;

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Riwayat Absensi Saya</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{records.length} total rekord</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => exportToPDF(filtered)} className="btn-secondary" style={{ fontSize: 13 }}>PDF</button>
          <button onClick={() => exportToExcel(filtered)} className="btn-primary" style={{ fontSize: 13 }}>
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Hadir",       value: hadir,    color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { label: "Terlambat",   value: telat,    color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
          { label: "Tidak Hadir", value: absen,    color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
          { label: "Kehadiran",   value: `${rate}%`,color:"#6366f1", bg:"rgba(99,102,241,0.1)" },
        ].map((c) => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.color}30`, borderRadius: "var(--radius-md)", padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
        <select className="input-field" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="hadir">Hadir</option>
          <option value="terlambat">Terlambat</option>
          <option value="tidak_hadir">Tidak Hadir</option>
        </select>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>Tanggal</th><th>Status</th><th>Jam Masuk</th><th>Jam Keluar</th><th>Wajah</th><th>GPS</th></tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{format(new Date(r.date), "EEE, dd MMM yyyy", { locale: idLocale })}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.checkIn?.time ?? "–"}</td>
                  <td>{r.checkOut?.time ?? "–"}</td>
                  <td style={{ color: r.checkIn?.faceVerified ? "#10b981" : "var(--text-muted)", fontSize: 13 }}>
                    {r.checkIn?.faceVerified ? "✓" : "–"}
                  </td>
                  <td style={{ color: r.checkIn?.locationVerified ? "#10b981" : "var(--text-muted)", fontSize: 13 }}>
                    {r.checkIn?.locationVerified ? "✓" : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Tidak ada data</div>
        )}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: "1px solid var(--border-glass)", flexWrap: "wrap", gap: 16 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Menampilkan {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} dari {filtered.length}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                style={{ padding: "6px 12px", borderRadius: 6, background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1, color: "var(--text-primary)" }}>
                Prev
              </button>
              <span style={{ padding: "6px 12px", fontSize: 13, display: "flex", alignItems: "center" }}>
                Hal {currentPage} / {totalPages}
              </span>
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                style={{ padding: "6px 12px", borderRadius: 6, background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1, color: "var(--text-primary)" }}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
