"use client";
import { useStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { FileText, Search, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function AdminIzinPage() {
  const { permits, students, classes, updatePermit } = useStore();
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const filtered = permits.filter(p => {
    const matchKelas = filterKelas === "all" || p.kelas === filterKelas;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchSearch = search === "" || p.studentName.toLowerCase().includes(search.toLowerCase());
    return matchKelas && matchStatus && matchSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Reset pagination when filters change
   
   
  useEffect(() => { setCurrentPage(1); }, [filterKelas, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const TYPE_COLOR: Record<string, string> = { izin: "#3b82f6", sakit: "#ef4444", dispensasi: "#8b5cf6" };
  const TYPE_LABEL: Record<string, string> = { izin: "Izin", sakit: "Sakit", dispensasi: "Dispensasi" };

  const stats = {
    total: permits.length,
    pending: permits.filter(p => p.status === "pending").length,
    approved: permits.filter(p => p.status === "approved").length,
    rejected: permits.filter(p => p.status === "rejected").length,
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Rekap Izin & Dispensasi</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Pantau semua permohonan izin dari seluruh kelas.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total", value: stats.total, color: "#6366f1", type: "primary" },
          { label: "Pending", value: stats.pending, color: "#f59e0b", type: "warning" },
          { label: "Disetujui", value: stats.approved, color: "#10b981", type: "success" },
          { label: "Ditolak", value: stats.rejected, color: "#ef4444", type: "danger" },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.type}`}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input-field" placeholder="Cari nama siswa..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input-field" value={filterKelas} onChange={e => setFilterKelas(e.target.value)}
          style={{ width: "auto", colorScheme: "dark" }}>
          <option value="all">Semua Kelas</option>
          {classes.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="input-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ width: "auto", colorScheme: "dark" }}>
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 24 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
            <FileText size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div>Tidak ada data sesuai filter</div>
          </div>
        ) : (
          <div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Siswa</th>
                    <th>Kelas</th>
                    <th>Jenis</th>
                    <th>Tanggal</th>
                    <th>Alasan</th>
                    <th>Status</th>
                    <th>Pengajuan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{p.studentName}</td>
                      <td>{p.kelas}</td>
                      <td>
                        <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10,
                          background: `${TYPE_COLOR[p.type]}15`, color: TYPE_COLOR[p.type] }}>
                          {TYPE_LABEL[p.type]}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {format(new Date(p.startDate), "dd MMM yyyy")}
                        {p.startDate !== p.endDate && <><br />{format(new Date(p.endDate), "dd MMM yyyy")}</>}
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.reason}>
                          {p.reason}
                        </div>
                      </td>
                      <td>
                        {p.status === "approved" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#10b981", fontSize: 13 }}>
                            <CheckCircle size={14} /> Disetujui
                          </div>
                        )}
                        {p.status === "rejected" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#ef4444", fontSize: 13 }}>
                            <XCircle size={14} /> Ditolak
                          </div>
                        )}
                        {p.status === "pending" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#f59e0b", fontSize: 13 }}>
                            <Clock size={14} /> Pending
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {format(new Date(p.createdAt), "dd MMM yyyy", { locale: idLocale })}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {p.status === "pending" ? (
                            <>
                              <button onClick={() => updatePermit(p.id, { status: "approved" })}
                                style={{ background: "rgba(16,185,129,0.1)", border: "none", color: "#10b981", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                                Setuju
                              </button>
                              <button onClick={() => updatePermit(p.id, { status: "rejected" })}
                                style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                                Tolak
                              </button>
                            </>
                          ) : (
                            <button onClick={() => updatePermit(p.id, { status: "pending" })}
                              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", color: "var(--text-secondary)", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                              Undo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
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
        )}
      </div>
    </div>
  );
}
