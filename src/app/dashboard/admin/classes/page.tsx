"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Users, BookOpen } from "lucide-react";

// Komponen Halaman Manajemen Kelas (Dashboard Admin)
// Digunakan untuk melakukan operasi CRUD (Create, Read, Update, Delete) pada data kelas sekolah
export default function AdminClassesPage() {
  // Mengambil state dan fungsi global terkait manajemen kelas dari Zustand
  const { students, classes, addClass, updateClass, deleteClass } = useStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editTarget, setEditTarget] = useState("");
  const [newClass, setNewClass] = useState("");

  // Filter daftar kelas berdasarkan teks pencarian (search bar)
  const filtered = classes.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  ).sort();

  // Fungsi utama untuk menangani proses simpan (baik saat tambah baru maupun edit kelas)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClass.trim()) {
      if (isEdit) {
        updateClass(editTarget, newClass.trim());
      } else {
        addClass(newClass.trim());
      }
      setNewClass("");
      setShowModal(false);
    }
  };

  // Fungsi untuk membuka modal dalam mode Edit dengan membawa data kelas terpilih
  const openEdit = (kelas: string) => {
    setIsEdit(true);
    setEditTarget(kelas);
    setNewClass(kelas);
    setShowModal(true);
  };

  const openAdd = () => {
    setIsEdit(false);
    setNewClass("");
    setShowModal(true);
  };

  // Fungsi untuk menghapus kelas setelah mendapat persetujuan (konfirmasi) dari admin
  const handleDelete = (kelas: string) => {
    if (window.confirm(`Yakin ingin menghapus kelas ${kelas}?`)) {
      deleteClass(kelas);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Manajemen Kelas</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{classes.length} kelas terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ fontSize: 13 }}>
          <Plus size={15} /> Tambah Kelas
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 24, maxWidth: 300 }}>
        <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input className="input-field" style={{ paddingLeft: 38 }}
          placeholder="Cari nama kelas..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {filtered.map((kelasName) => {
          const classStudents = students.filter((s) => s.kelas === kelasName);
          return (
            <div key={kelasName} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BookOpen size={20} color="#6366f1" />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{kelasName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Program Keahlian Umum</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
                <Users size={14} /> {classStudents.length} Siswa Terdaftar
              </div>
              <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border-glass)", paddingTop: 16 }}>
                <button onClick={() => openEdit(kelasName)} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}>
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => handleDelete(kelasName)} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 12, color: "#ef4444" }}>
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-card" style={{ width: 400, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{isEdit ? "Edit Kelas" : "Tambah Kelas Baru"}</h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Nama Kelas</label>
                <input className="input-field" placeholder="Contoh: XII IPA 1" value={newClass} onChange={(e) => setNewClass(e.target.value)} required />
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
