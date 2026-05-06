"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Teacher } from "@/lib/types";

export default function AdminTeachersPage() {
  const { teachers, classes, addTeacher, updateTeacher, deleteTeacher } = useStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editTarget, setEditTarget] = useState("");
  const [formData, setFormData] = useState({ name: "", username: "", nip: "", kelasWali: "", mataPelajaran: "", password: "" });

  const filtered = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.username || (t as any).email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const mapelArray = formData.mataPelajaran ? formData.mataPelajaran.split(",").map(s => s.trim()).filter(Boolean) : [];
    if (isEdit) {
      const updates: Partial<Teacher> = {
        name: formData.name,
        username: formData.username,
        nip: formData.nip,
        kelasWali: formData.kelasWali || undefined,
        mataPelajaran: mapelArray,
      };
      if (formData.password.trim()) {
        updates.password = formData.password; // in real app, hash it here first
      }
      updateTeacher(editTarget, updates);
    } else {
      addTeacher({
        id: uuidv4(),
        name: formData.name,
        username: formData.username,
        password: formData.password || "password123",
        role: "guru",
        nip: formData.nip,
        mataPelajaran: mapelArray,
        kelasWali: formData.kelasWali || undefined,
        isActive: true,
        createdAt: new Date().toISOString()
      });
    }
    setFormData({ name: "", username: "", nip: "", kelasWali: "", mataPelajaran: "", password: "" });
    setShowModal(false);
  };

  const openAdd = () => {
    setIsEdit(false);
    setFormData({ name: "", username: "", nip: "", kelasWali: "", mataPelajaran: "", password: "" });
    setShowModal(true);
  };

  const openEdit = (t: Teacher) => {
    setIsEdit(true);
    setEditTarget(t.id);
    setFormData({ name: t.name, username: t.username, nip: t.nip, kelasWali: t.kelasWali || "", mataPelajaran: (t.mataPelajaran || []).join(", "), password: "" });
    setShowModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus guru ${name}?`)) {
      deleteTeacher(id);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Manajemen Guru</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{teachers.length} guru terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ fontSize: 13 }}>
          <Plus size={15} /> Tambah Guru
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 20, maxWidth: 300 }}>
        <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input className="input-field" style={{ paddingLeft: 38 }}
          placeholder="Cari nama atau username..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>No</th><th>Nama</th><th>NIP</th><th>Wali Kelas</th><th>Username</th><th>Mata Pelajaran</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id}>
                  <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-primary)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
                        {t.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{t.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace" }}>{t.nip}</td>
                  <td>
                    {t.kelasWali ? (
                      <span className="badge badge-purple">{t.kelasWali}</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>–</span>
                    )}
                  </td>
                  <td>{t.username}</td>
                  <td>
                    {t.mataPelajaran?.length > 0 ? t.mataPelajaran.join(", ") : "-"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(t)} style={{ background: "rgba(99,102,241,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#6366f1" }}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(t.id, t.name)} style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#ef4444" }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-card" style={{ width: 400, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{isEdit ? "Edit Guru" : "Tambah Guru Baru"}</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Nama Lengkap</label>
                  <input className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Username</label>
                  <input type="text" className="input-field" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                    Password Login {isEdit && <span style={{ fontSize: 11, fontStyle: "italic", color: "var(--text-muted)" }}>(Kosongkan jika tidak ingin mengubah)</span>}
                  </label>
                  <input type="text" className="input-field" placeholder={isEdit ? "********" : "password123"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>NIP</label>
                  <input className="input-field" value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Mata Pelajaran (Pisahkan dengan koma)</label>
                  <input className="input-field" placeholder="Contoh: Matematika, Fisika" value={formData.mataPelajaran} onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Wali Kelas (Opsional)</label>
                  <select className="input-field" value={formData.kelasWali} onChange={(e) => setFormData({ ...formData, kelasWali: e.target.value })}>
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
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
