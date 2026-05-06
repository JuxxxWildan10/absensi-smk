"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { FileText, Plus, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { PermitRequest, PermitType } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import Toast, { ToastType } from "@/components/Toast";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";

const PERMIT_TYPE_LABEL: Record<PermitType, string> = {
  izin: "Izin",
  sakit: "Sakit",
  dispensasi: "Dispensasi",
};

const PERMIT_TYPE_COLOR: Record<PermitType, string> = {
  izin: "#3b82f6",
  sakit: "#ef4444",
  dispensasi: "#8b5cf6",
};

export default function SiswaIzinPage() {
  const { currentUser, permits, addPermit, getPermitsByStudent, addInAppNotification } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [form, setForm] = useState({
    type: "izin" as PermitType,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  if (!currentUser) return null;
  const student = currentUser as import("@/lib/types").Student;
  const myPermits = getPermitsByStudent(currentUser.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleSubmit = () => {
    if (!form.reason.trim()) {
      setToast({ message: "Mohon isi alasan/keterangan", type: "error" });
      return;
    }
    if (form.startDate > form.endDate) {
      setToast({ message: "Tanggal selesai tidak boleh sebelum tanggal mulai", type: "error" });
      return;
    }

    const permit: PermitRequest = {
      id: uuidv4(),
      studentId: currentUser.id,
      studentName: currentUser.name,
      kelas: student.kelas || "",
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    addPermit(permit);
    // In-app notification for teacher
    addInAppNotification({
      id: uuidv4(),
      userId: "guru-001", // simplified — real app looks up class teacher
      title: "Permohonan Izin Baru",
      message: `${currentUser.name} mengajukan ${PERMIT_TYPE_LABEL[form.type]} (${form.startDate})`,
      type: "warning",
      isRead: false,
      link: "/dashboard/guru/izin",
      createdAt: new Date().toISOString(),
    });

    setToast({ message: "Permohonan izin berhasil dikirim!", type: "success" });
    setShowForm(false);
    setForm({ type: "izin", startDate: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0], reason: "" });
  };

  const getStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle size={16} color="#10b981" />;
    if (status === "rejected") return <XCircle size={16} color="#ef4444" />;
    return <Clock size={16} color="#f59e0b" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "approved") return "#10b981";
    if (status === "rejected") return "#ef4444";
    return "#f59e0b";
  };

  const getStatusLabel = (status: string) => {
    if (status === "approved") return "Disetujui";
    if (status === "rejected") return "Ditolak";
    return "Menunggu";
  };

  return (
    <div className="animate-fadeIn">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Surat Izin & Dispensasi</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Ajukan izin atau dispensasi secara digital, tanpa perlu surat fisik.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} id="btn-ajukan-izin">
          <Plus size={16} /> Ajukan Izin Baru
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Pengajuan", value: myPermits.length, color: "#6366f1" },
          { label: "Disetujui", value: myPermits.filter(p => p.status === "approved").length, color: "#10b981" },
          { label: "Menunggu", value: myPermits.filter(p => p.status === "pending").length, color: "#f59e0b" },
          { label: "Ditolak", value: myPermits.filter(p => p.status === "rejected").length, color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={20} color="var(--accent-primary)" /> Form Pengajuan Izin
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Jenis Izin</label>
                <select className="input-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PermitType }))}
                  style={{ colorScheme: "dark" }}>
                  <option value="izin">Izin (keperluan pribadi/keluarga)</option>
                  <option value="sakit">Sakit</option>
                  <option value="dispensasi">Dispensasi (lomba, kegiatan resmi, dll)</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Tanggal Mulai</label>
                  <input type="date" className="input-field" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    style={{ colorScheme: "dark" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Tanggal Selesai</label>
                  <input type="date" className="input-field" value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    style={{ colorScheme: "dark" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Alasan / Keterangan</label>
                <textarea className="input-field" rows={4} placeholder="Tuliskan alasan dengan jelas..."
                  value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  style={{ resize: "vertical" }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "10px 14px", background: "rgba(59,130,246,0.06)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.15)" }}>
                💡 Permohonan akan diteruskan ke wali kelas untuk diproses. Harap lampirkan bukti fisik (surat dokter, dll) ke wali kelas Anda.
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button className="btn-primary" onClick={handleSubmit} id="btn-kirim-izin">
                  <Send size={16} /> Kirim Permohonan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Riwayat Pengajuan</div>
        {myPermits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
            <FileText size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div>Belum ada pengajuan izin</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myPermits.map(p => (
              <div key={p.id} style={{ padding: 16, background: "var(--bg-glass)", borderRadius: 12, border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                        background: `${PERMIT_TYPE_COLOR[p.type]}18`, color: PERMIT_TYPE_COLOR[p.type],
                        border: `1px solid ${PERMIT_TYPE_COLOR[p.type]}30` }}>
                        {PERMIT_TYPE_LABEL[p.type]}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: getStatusColor(p.status) }}>
                        {getStatusIcon(p.status)} {getStatusLabel(p.status)}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{p.reason}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      📅 {format(new Date(p.startDate), "dd MMM yyyy", { locale: idLocale })}
                      {p.startDate !== p.endDate && ` – ${format(new Date(p.endDate), "dd MMM yyyy", { locale: idLocale })}`}
                    </div>
                    {p.status === "rejected" && p.rejectedReason && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444", padding: "6px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 6 }}>
                        ❌ Alasan penolakan: {p.rejectedReason}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
                    {format(new Date(p.createdAt), "dd MMM yyyy HH:mm", { locale: idLocale })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
