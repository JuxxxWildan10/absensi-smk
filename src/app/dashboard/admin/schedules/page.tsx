"use client";
import { useStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { Search, Calendar, Plus, Trash2, Edit2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ClassSchedule } from "@/lib/types";

export default function AdminSchedulesPage() {
  const { schedules, classes, teachers, addSchedule, updateSchedule, deleteSchedule } = useStore();
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterDay, setFilterDay] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editTarget, setEditTarget] = useState("");
  const [formData, setFormData] = useState<Omit<ClassSchedule, "id">>({ kelas: "", day: "Senin", startTime: "", endTime: "", subjectName: "", teacherId: "" });

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const filtered = schedules.filter(s => {
    const matchKelas = filterKelas === "all" || s.kelas === filterKelas;
    const matchDay = filterDay === "all" || s.day === filterDay;
    const matchSearch = search === "" || s.subjectName.toLowerCase().includes(search.toLowerCase());
    return matchKelas && matchDay && matchSearch;
  });

  // Reset pagination when filter changes
  useEffect(() => { setCurrentPage(1); }, [filterKelas, filterDay, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || "Unknown";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateSchedule(editTarget, formData);
    } else {
      addSchedule({ id: uuidv4(), ...formData });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, subject: string) => {
    if (window.confirm(`Yakin ingin menghapus jadwal ${subject}?`)) {
      deleteSchedule(id);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Jadwal Pelajaran</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Manajemen jadwal mata pelajaran untuk semua kelas.</p>
        </div>
        <button onClick={() => { setIsEdit(false); setFormData({ kelas: classes[0] || "", day: "Senin", startTime: "07:00", endTime: "08:30", subjectName: "", teacherId: "" }); setShowModal(true); }} className="btn-primary" style={{ fontSize: 13 }}>
          <Plus size={15} /> Tambah Jadwal
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input-field" placeholder="Cari mata pelajaran..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input-field" value={filterKelas} onChange={e => setFilterKelas(e.target.value)} style={{ width: "auto" }}>
          <option value="all">Semua Kelas</option>
          {classes.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="input-field" value={filterDay} onChange={e => setFilterDay(e.target.value)} style={{ width: "auto" }}>
          <option value="all">Semua Hari</option>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 24 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
            <Calendar size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div>Tidak ada jadwal yang sesuai filter</div>
          </div>
        ) : (
          <div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hari</th>
                    <th>Jam</th>
                    <th>Kelas</th>
                    <th>Mata Pelajaran</th>
                    <th>Guru</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{s.day}</td>
                      <td>{s.startTime} - {s.endTime}</td>
                      <td>{s.kelas}</td>
                      <td style={{ fontWeight: 500 }}>{s.subjectName}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{getTeacherName(s.teacherId)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setIsEdit(true); setEditTarget(s.id); setFormData({ kelas: s.kelas, day: s.day, startTime: s.startTime, endTime: s.endTime, subjectName: s.subjectName, teacherId: s.teacherId }); setShowModal(true); }} style={{ background: "rgba(99,102,241,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#6366f1" }} title="Edit"><Edit2 size={13} /></button>
                          <button onClick={() => handleDelete(s.id, s.subjectName)} style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#ef4444" }} title="Hapus"><Trash2 size={13} /></button>
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

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-card" style={{ width: 400, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{isEdit ? "Edit Jadwal" : "Tambah Jadwal"}</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Kelas</label>
                  <select className="input-field" value={formData.kelas} onChange={(e) => setFormData({ ...formData, kelas: e.target.value })} required>
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Hari</label>
                  <select className="input-field" value={formData.day} onChange={(e) => setFormData({ ...formData, day: e.target.value as ClassSchedule["day"] })} required>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Jam Mulai</label>
                    <input type="time" className="input-field" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Jam Selesai</label>
                    <input type="time" className="input-field" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Mata Pelajaran</label>
                  <input type="text" className="input-field" value={formData.subjectName} onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Guru Pengajar</label>
                  <select className="input-field" value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })} required>
                    <option value="">-- Pilih Guru --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.mataPelajaran?.join(", ")})</option>)}
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
