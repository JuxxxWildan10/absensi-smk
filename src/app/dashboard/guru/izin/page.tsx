"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { FileText, CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";
import { PermitRequest } from "@/lib/types";
import Toast, { ToastType } from "@/components/Toast";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export default function GuruIzinPage() {
  const { currentUser, permits, updatePermit, addAttendance, addInAppNotification } = useStore();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PermitRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  if (!currentUser) return null;
  const teacher = currentUser as import("@/lib/types").Teacher;
  const myKelas = teacher.kelasWali || "";

  const myPermits = permits.filter(p =>
    p.kelas === myKelas &&
    (filterStatus === "all" || p.status === filterStatus) &&
    (search === "" || p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.reason.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleApprove = (permit: PermitRequest) => {
    updatePermit(permit.id, {
      status: "approved",
      approvedBy: currentUser.id,
      approvedAt: new Date().toISOString(),
    });
    // Update attendance records for date range
    const start = new Date(permit.startDate);
    const end = new Date(permit.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const ds = d.toISOString().split("T")[0];
      addAttendance({
        id: `att-${permit.studentId}-${ds}-${permit.type}`,
        studentId: permit.studentId,
        studentName: permit.studentName,
        kelas: permit.kelas,
        date: ds,
        status: permit.type === "sakit" ? "sakit" : "izin",
        notes: `${permit.type === "sakit" ? "Sakit" : permit.type === "dispensasi" ? "Dispensasi" : "Izin"}: ${permit.reason}`,
      });
    }
    // Notify student
    addInAppNotification({
      id: uuidv4(),
      userId: permit.studentId,
      title: "Izin Disetujui ✓",
      message: `Permohonan ${permit.type} Anda tanggal ${permit.startDate} telah disetujui oleh wali kelas.`,
      type: "success",
      isRead: false,
      link: "/dashboard/siswa/izin",
      createdAt: new Date().toISOString(),
    });
    setSelected(null);
    setToast({ message: "Permohonan izin disetujui!", type: "success" });
  };

  const handleReject = (permit: PermitRequest) => {
    if (!rejectReason.trim()) {
      setToast({ message: "Harap isi alasan penolakan", type: "error" });
      return;
    }
    updatePermit(permit.id, {
      status: "rejected",
      approvedBy: currentUser.id,
      approvedAt: new Date().toISOString(),
      rejectedReason: rejectReason,
    });
    addInAppNotification({
      id: uuidv4(),
      userId: permit.studentId,
      title: "Izin Ditolak",
      message: `Permohonan ${permit.type} Anda ditolak. Alasan: ${rejectReason}`,
      type: "danger",
      isRead: false,
      link: "/dashboard/siswa/izin",
      createdAt: new Date().toISOString(),
    });
    setSelected(null);
    setRejectReason("");
    setToast({ message: "Permohonan izin ditolak.", type: "info" });
  };

  const FILTER_TABS: { label: string; value: FilterStatus; color: string }[] = [
    { label: "Semua", value: "all", color: "#6366f1" },
    { label: "Pending", value: "pending", color: "#f59e0b" },
    { label: "Disetujui", value: "approved", color: "#10b981" },
    { label: "Ditolak", value: "rejected", color: "#ef4444" },
  ];

  const TYPE_COLOR: Record<string, string> = { izin: "#3b82f6", sakit: "#ef4444", dispensasi: "#8b5cf6" };
  const TYPE_LABEL: Record<string, string> = { izin: "Izin", sakit: "Sakit", dispensasi: "Dispensasi" };

  return (
    <div className="animate-fadeIn">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Manajemen Izin Siswa</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Kelas Wali: <strong style={{ color: "var(--text-primary)" }}>{myKelas || "–"}</strong></p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total", value: permits.filter(p => p.kelas === myKelas).length, color: "#6366f1" },
          { label: "Pending", value: permits.filter(p => p.kelas === myKelas && p.status === "pending").length, color: "#f59e0b" },
          { label: "Disetujui", value: permits.filter(p => p.kelas === myKelas && p.status === "approved").length, color: "#10b981" },
          { label: "Ditolak", value: permits.filter(p => p.kelas === myKelas && p.status === "rejected").length, color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input-field" placeholder="Cari nama/alasan..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {FILTER_TABS.map(tab => (
            <button key={tab.value} onClick={() => setFilterStatus(tab.value)}
              style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: filterStatus === tab.value ? `${tab.color}20` : "var(--bg-glass)",
                color: filterStatus === tab.value ? tab.color : "var(--text-muted)",
                border: `1px solid ${filterStatus === tab.value ? tab.color + "40" : "var(--border-glass)"}` }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="glass-card" style={{ padding: 24 }}>
        {myPermits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
            <FileText size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div>Tidak ada data izin {filterStatus !== "all" ? `dengan status "${filterStatus}"` : ""}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myPermits.map(p => (
              <div key={p.id} style={{ padding: 16, background: "var(--bg-glass)", borderRadius: 12, border: "1px solid var(--border-glass)",
                transition: "all 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-glow)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-glass)")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{p.studentName}</span>
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 12,
                        background: `${TYPE_COLOR[p.type]}15`, color: TYPE_COLOR[p.type] }}>
                        {TYPE_LABEL[p.type]}
                      </span>
                      {p.status === "pending" && <span className="badge badge-warning">Menunggu</span>}
                      {p.status === "approved" && <span className="badge badge-success">Disetujui</span>}
                      {p.status === "rejected" && <span className="badge badge-danger">Ditolak</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{p.reason}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      📅 {format(new Date(p.startDate), "dd MMM yyyy", { locale: idLocale })}
                      {p.startDate !== p.endDate && ` – ${format(new Date(p.endDate), "dd MMM yyyy", { locale: idLocale })}`}
                    </div>
                    {p.status === "rejected" && p.rejectedReason && (
                      <div style={{ marginTop: 6, fontSize: 12, color: "#ef4444" }}>Alasan penolakan: {p.rejectedReason}</div>
                    )}
                  </div>
                  {p.status === "pending" && (
                    <button onClick={() => setSelected(p)} className="btn-primary" style={{ padding: "8px 16px", fontSize: 13 }} id={`btn-proses-${p.id}`}>
                      Proses
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal proses */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setRejectReason(""); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Proses Permohonan Izin</h2>
            <div style={{ padding: 16, background: "var(--bg-glass)", borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{selected.studentName}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>{selected.reason}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {TYPE_LABEL[selected.type]} · {format(new Date(selected.startDate), "dd MMM yyyy")}
                {selected.startDate !== selected.endDate && ` – ${format(new Date(selected.endDate), "dd MMM yyyy")}`}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Alasan penolakan (isi jika ditolak)</label>
              <textarea className="input-field" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Contoh: Harap lampirkan surat keterangan dokter..." style={{ resize: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setSelected(null); setRejectReason(""); }} className="btn-secondary" style={{ flex: 1 }}>Batal</button>
              <button onClick={() => handleReject(selected)} className="btn-danger" style={{ flex: 1 }} id="btn-tolak-izin">
                <XCircle size={16} /> Tolak
              </button>
              <button onClick={() => handleApprove(selected)} className="btn-success" style={{ flex: 1 }} id="btn-setujui-izin">
                <CheckCircle size={16} /> Setujui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
