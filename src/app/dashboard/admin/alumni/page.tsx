"use client";
import { useStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { Search, GraduationCap, Download, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

const PAGE_SIZE = 25;

export default function AdminAlumniPage() {
  const { students } = useStore();
  
  // Ambil hanya siswa yang sudah alumni
  const alumni = useMemo(() => students.filter(s => s.isAlumni), [students]);

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Ambil daftar tahun kelulusan unik
  const graduationYears = useMemo(() => {
    const years = new Set(alumni.map(a => a.graduationYear).filter(Boolean));
    return Array.from(years).sort((a, b) => (b as number) - (a as number));
  }, [alumni]);

  const formatAlumniClass = (kelas: string, year?: number) => {
    if (!year) return "Alumni";
    // Contoh: "XII RPL 1" -> "rpl 1"
    const parsedKelas = kelas.replace(/XII /i, "").toLowerCase();
    return `lulus ${year} ${parsedKelas}`;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return alumni
      .filter((s) => {
        const matchSearch =
          s.name.toLowerCase().includes(q) ||
          s.nisn.includes(q) ||
          (s.username || "").toLowerCase().includes(q);
        const matchYear = yearFilter === "all" || s.graduationYear?.toString() === yearFilter;
        return matchSearch && matchYear;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "id"));
  }, [alumni, search, yearFilter]);

  /* ── Pagination ─────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  };

  /* ── Export ─────────────────────────────────── */
  const exportData = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map(s => ({
        Nama: s.name,
        NISN: s.nisn,
        Angkatan: formatAlumniClass(s.kelas, s.graduationYear),
        "Tahun Lulus": s.graduationYear,
        Jurusan: s.jurusan,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Alumni");
    XLSX.writeFile(wb, "Data_Alumni.xlsx");
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            <GraduationCap size={28} color="var(--accent-primary)" /> Manajemen Alumni
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {alumni.length} alumni terdaftar
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={exportData} className="btn-secondary" style={{ fontSize: 13 }}>
            <Download size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Cari nama, NISN alumni..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field" style={{ width: "auto", minWidth: 150 }} value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}>
          <option value="all">Semua Tahun</option>
          {graduationYears.map((y) => <option key={y as number} value={y as number}>Lulusan {y as number}</option>)}
        </select>
        <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {filtered.length} hasil
        </span>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>No</th>
                <th>Nama Alumni</th>
                <th>NISN</th>
                <th>Angkatan / Keterangan</th>
                <th>Tahun Lulus</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-glass)", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
                        {s.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>{s.nisn}</td>
                  <td>
                    <span className="badge" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                      {formatAlumniClass(s.kelas, s.graduationYear)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.graduationYear || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
            Belum ada data alumni
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid var(--border-glass)", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length} alumni
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => goPage(1)} disabled={safePage === 1}
                style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 10px", cursor: safePage === 1 ? "not-allowed" : "pointer", opacity: safePage === 1 ? 0.4 : 1, color: "var(--text-secondary)", fontSize: 12 }}>
                «
              </button>
              <button onClick={() => goPage(safePage - 1)} disabled={safePage === 1}
                style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 10px", cursor: safePage === 1 ? "not-allowed" : "pointer", opacity: safePage === 1 ? 0.4 : 1, color: "var(--text-secondary)" }}>
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}
                style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 10px", cursor: safePage === totalPages ? "not-allowed" : "pointer", opacity: safePage === totalPages ? 0.4 : 1, color: "var(--text-secondary)" }}>
                <ChevronRight size={15} />
              </button>
              <button onClick={() => goPage(totalPages)} disabled={safePage === totalPages}
                style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 10px", cursor: safePage === totalPages ? "not-allowed" : "pointer", opacity: safePage === totalPages ? 0.4 : 1, color: "var(--text-secondary)", fontSize: 12 }}>
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
