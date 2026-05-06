"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Megaphone, Plus, Trash2, AlertTriangle, Bell, Info, Search } from "lucide-react";
import { Announcement, AnnouncementPriority, UserRole } from "@/lib/types";
import Toast, { ToastType } from "@/components/Toast";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";

const PRIORITY_CONFIG: Record<AnnouncementPriority, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  normal:  { label: "Normal",  color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  icon: Info },
  penting: { label: "Penting", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: Bell },
  darurat: { label: "Darurat", color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: AlertTriangle },
};

const ALL_ROLES: UserRole[] = ["admin", "guru", "siswa", "wali"];
const ROLE_LABEL: Record<UserRole, string> = { admin: "Admin", guru: "Guru", siswa: "Siswa", wali: "Wali Murid" };

export default function AdminPengumumanPage() {
  const { currentUser, announcements, addAnnouncement, deleteAnnouncement } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal" as AnnouncementPriority,
    targetRoles: ["siswa", "guru"] as UserRole[],
    expiresAt: "",
  });

  const filtered = announcements.filter(a =>
    (filterPriority === "all" || a.priority === filterPriority) &&
    (search === "" || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const toggleRole = (role: UserRole) => {
    setForm(f => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter(r => r !== role)
        : [...f.targetRoles, role],
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      setToast({ message: "Judul dan isi pengumuman wajib diisi", type: "error" });
      return;
    }
    if (form.targetRoles.length === 0) {
      setToast({ message: "Pilih minimal satu target penerima", type: "error" });
      return;
    }
    const ann: Announcement = {
      id: uuidv4(),
      title: form.title,
      content: form.content,
      priority: form.priority,
      targetRoles: form.targetRoles,
      publishedAt: new Date().toISOString(),
      expiresAt: form.expiresAt || undefined,
      authorId: currentUser?.id ?? "admin-001",
      authorName: currentUser?.name ?? "Admin",
    };
    addAnnouncement(ann);
    setToast({ message: "Pengumuman berhasil dipublikasikan!", type: "success" });
    setShowForm(false);
    setForm({ title: "", content: "", priority: "normal", targetRoles: ["siswa", "guru"], expiresAt: "" });
  };

  return (
    <div className="animate-fadeIn">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <Megaphone size={24} color="var(--accent-primary)" /> Pengumuman Sekolah
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Publikasikan pengumuman ke semua pengguna secara terpusat.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} id="btn-buat-pengumuman">
          <Plus size={16} /> Buat Pengumuman
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 16, marginBottom: 24 }}>
        {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="glass-card" style={{ padding: 20 }}>
              <Icon size={20} color={cfg.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 28, fontWeight: 800, color: cfg.color }}>
                {announcements.filter(a => a.priority === key).length}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{cfg.label}</div>
            </div>
          );
        })}
        <div className="glass-card" style={{ padding: 20 }}>
          <Megaphone size={20} color="#6366f1" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: "#6366f1" }}>{announcements.length}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Total</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input-field" placeholder="Cari pengumuman..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input-field" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{ width: "auto", colorScheme: "dark" }}>
          <option value="all">Semua Prioritas</option>
          <option value="normal">Normal</option>
          <option value="penting">Penting</option>
          <option value="darurat">Darurat</option>
        </select>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            <Megaphone size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div>Belum ada pengumuman</div>
          </div>
        ) : (
          filtered.map(ann => {
            const cfg = PRIORITY_CONFIG[ann.priority];
            const Icon = cfg.icon;
            return (
              <div key={ann.id} className="glass-card" style={{ padding: 24, borderLeft: `4px solid ${cfg.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
                        padding: "3px 10px", borderRadius: 12, background: cfg.bg, color: cfg.color }}>
                        <Icon size={12} /> {cfg.label}
                      </span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {ann.targetRoles.map(r => (
                          <span key={r} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 10,
                            background: "var(--bg-glass)", color: "var(--text-muted)" }}>
                            {ROLE_LABEL[r]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{ann.title}</h3>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{ann.content}</p>
                    <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 16 }}>
                      <span>Dipublikasikan oleh {ann.authorName}</span>
                      <span>{format(new Date(ann.publishedAt), "dd MMM yyyy HH:mm", { locale: idLocale })}</span>
                      {ann.expiresAt && <span>Kadaluarsa: {format(new Date(ann.expiresAt), "dd MMM yyyy")}</span>}
                    </div>
                  </div>
                  <button onClick={() => { deleteAnnouncement(ann.id); setToast({ message: "Pengumuman dihapus", type: "info" }); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 8, borderRadius: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Megaphone size={18} color="var(--accent-primary)" /> Buat Pengumuman Baru
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Judul Pengumuman</label>
                <input className="input-field" placeholder="Contoh: Jadwal Ujian Akhir Semester..." value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Isi Pengumuman</label>
                <textarea className="input-field" rows={5} value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Tuliskan detail pengumuman..." style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Prioritas</label>
                  <select className="input-field" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as AnnouncementPriority }))}
                    style={{ colorScheme: "dark" }}>
                    <option value="normal">Normal</option>
                    <option value="penting">Penting</option>
                    <option value="darurat">Darurat</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Kadaluarsa (opsional)</label>
                  <input type="date" className="input-field" value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} style={{ colorScheme: "dark" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 8, color: "var(--text-secondary)" }}>Target Penerima</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ALL_ROLES.map(role => (
                    <button key={role} onClick={() => toggleRole(role)}
                      style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.2s",
                        background: form.targetRoles.includes(role) ? "var(--gradient-primary)" : "var(--bg-glass)",
                        color: form.targetRoles.includes(role) ? "white" : "var(--text-muted)" }}>
                      {ROLE_LABEL[role]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button className="btn-primary" onClick={handleSubmit} id="btn-publish-pengumuman">
                  <Megaphone size={16} /> Publikasikan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
