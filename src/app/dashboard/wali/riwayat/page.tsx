"use client";
import { useStore } from "@/lib/store";
import { DUMMY_PARENTS, DUMMY_STUDENTS } from "@/lib/data";
import StatusBadge from "@/components/StatusBadge";
import { Download } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useState, useEffect } from "react";

export default function WaliRiwayatPage() {
  const { currentUser, records, students } = useStore();
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  if (!currentUser) return null;

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

  const myRecords = records.filter((r) => studentIds.includes(r.studentId) &&
    (statusFilter === "all" || r.status === statusFilter));

  const ITEMS_PER_PAGE = 20;

  const totalPages = Math.max(1, Math.ceil(myRecords.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = myRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Riwayat Absensi Anak</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {myStudents.map((s) => s.name).join(", ")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => exportToPDF(myRecords)} className="btn-secondary" style={{ fontSize: 13 }}>PDF</button>
          <button onClick={() => exportToExcel(myRecords)} className="btn-primary" style={{ fontSize: 13 }}>
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select className="input-field" style={{ width: "auto" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
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
              <tr><th>Tanggal</th><th>Nama Siswa</th><th>Kelas</th><th>Status</th><th>Jam Masuk</th><th>Jam Keluar</th></tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{format(new Date(r.date), "EEE, dd MMM yyyy", { locale: idLocale })}</td>
                  <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{r.studentName}</td>
                  <td>{r.kelas}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.checkIn?.time ?? "–"}</td>
                  <td>{r.checkOut?.time ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {myRecords.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Tidak ada data</div>
        )}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: "1px solid var(--border-glass)", flexWrap: "wrap", gap: 16 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Menampilkan {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, myRecords.length)} dari {myRecords.length}
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
