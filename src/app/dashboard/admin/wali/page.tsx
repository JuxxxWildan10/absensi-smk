"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Users, Plus, Edit2, Trash2, Search, Phone } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Parent } from "@/lib/types";

export default function AdminWaliPage() {
  const { parents, students, classes, addParent, updateParent, deleteParent } = useStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editTarget, setEditTarget] = useState("");
  const [selectedKelasForm, setSelectedKelasForm] = useState("all");
  const [formData, setFormData] = useState({
    name: "", username: "", password: "", phone: "", waNumber: "", studentIds: [] as string[],
  });

  const filtered = parents.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.username.toLowerCase().includes(search.toLowerCase())
  );

  const getStudentNames = (ids: string[]) =>
    ids.map(id => students.find(s => s.id === id)?.name || id).join(", ");

  const openAdd = () => {
    setIsEdit(false);
    setFormData({ name: "", username: "", password: "", phone: "", waNumber: "", studentIds: [] });
    setSelectedKelasForm("all");
    setShowModal(true);
  };

  const openEdit = (p: Parent) => {
    setIsEdit(true);
    setEditTarget(p.id);
    setFormData({ name: p.name, username: p.username, password: "", phone: p.phone || "", waNumber: p.waNumber || "", studentIds: p.studentIds });
    setSelectedKelasForm("all");
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      const updates: Partial<Parent> = {
        name: formData.name, username: formData.username,
        phone: formData.phone, waNumber: formData.waNumber, studentIds: formData.studentIds,
      };
      if (formData.password.trim()) updates.password = formData.password;
      updateParent(editTarget, updates);
    } else {
      addParent({
        id: uuidv4(), name: formData.name, username: formData.username,
        password: formData.password || "password123", role: "wali",
        phone: formData.phone, waNumber: formData.waNumber,
        studentIds: formData.studentIds, isActive: true,
        createdAt: new Date().toISOString(),
      });
    }
    setShowModal(false);
  };

  const handleDelete = (p: Parent) => {
    if (window.confirm(`Hapus wali murid ${p.name}?`)) deleteParent(p.id);
  };

  const toggleStudent = (studentId: string) => {
    setFormData(f => ({
      ...f,
      studentIds: f.studentIds.includes(studentId)
        ? f.studentIds.filter(id => id !== studentId)
        : [...f.studentIds, studentId],
    }));
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Wali Murid</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Manajemen akun wali murid dan kaitannya dengan siswa.</p>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ fontSize: 13 }}>
          <Plus size={15} /> Tambah Wali
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input className="input-field" placeholder="Cari nama atau username..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 24 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
            <Users size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div>Tidak ada data wali murid</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Wali</th>
                  <th>Username</th>
                  <th>No. HP / WA</th>
                  <th>Siswa yang Dipantau</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{p.username}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{p.phone || "–"}</div>
                      {p.waNumber && <div style={{ fontSize: 11, color: "#10b981" }}>WA: {p.waNumber}</div>}
                    </td>
                    <td>
                      {p.studentIds.length === 0 ? (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Belum ada</span>
                      ) : (
                        <div style={{ fontSize: 12 }}>{getStudentNames(p.studentIds)}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={{ background: "rgba(99,102,241,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#6366f1" }}><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(p)} style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#ef4444" }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: 500, padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{isEdit ? "Edit Wali Murid" : "Tambah Wali Murid"}</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Nama Lengkap</label>
                  <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Username</label>
                  <input className="input-field" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                    Password {isEdit && <span style={{ fontSize: 11, fontStyle: "italic", color: "var(--text-muted)" }}>(Kosongkan jika tidak ubah)</span>}
                  </label>
                  <input type="text" className="input-field" placeholder={isEdit ? "••••••••" : "password123"} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>No. HP</label>
                    <input className="input-field" placeholder="08xxxxxxxxxx" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>No. WhatsApp</label>
                    <input className="input-field" placeholder="628xxxxxxxxx" value={formData.waNumber} onChange={e => setFormData({ ...formData, waNumber: e.target.value })} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      Siswa yang Dipantau <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({formData.studentIds.length} dipilih)</span>
                    </label>
                    <select
                      className="input-field"
                      value={selectedKelasForm}
                      onChange={e => setSelectedKelasForm(e.target.value)}
                      style={{ width: "auto", padding: "4px 8px", fontSize: 12, height: "auto" }}
                    >
                      <option value="all">Semua Kelas</option>
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--border-glass)", borderRadius: 10, padding: 8 }}>
                    {students.length === 0 ? (
                      <div style={{ padding: 12, color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>Belum ada data siswa</div>
                    ) : students.filter(s => selectedKelasForm === "all" || s.kelas === selectedKelasForm).map(s => (
                      <label key={s.id} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                        borderRadius: 8, cursor: "pointer", fontSize: 13,
                        background: formData.studentIds.includes(s.id) ? "rgba(16,185,129,0.1)" : "transparent",
                        marginBottom: 2,
                      }}>
                        <input type="checkbox" checked={formData.studentIds.includes(s.id)}
                          onChange={() => toggleStudent(s.id)} style={{ accentColor: "#10b981" }} />
                        <span>
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          <span style={{ color: "var(--text-muted)", marginLeft: 6, fontSize: 11 }}>{s.kelas} · {s.nisn}</span>
                        </span>
                      </label>
                    ))}
                    {students.filter(s => selectedKelasForm === "all" || s.kelas === selectedKelasForm).length === 0 && students.length > 0 && (
                       <div style={{ padding: 12, color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>Tidak ada siswa di kelas ini</div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
