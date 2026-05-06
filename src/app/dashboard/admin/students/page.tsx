"use client";
import { useStore } from "@/lib/store";
import { useState, useRef, useMemo } from "react";
import {
  Search, Plus, Edit2, Trash2, UserCheck, Download,
  Upload, FileSpreadsheet, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, CheckSquare, Square, Trash, Smartphone,
} from "lucide-react";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { Student } from "@/lib/types";

const PAGE_SIZE = 25;
type SortField = "name" | "nisn" | "kelas" | "jurusan";
type SortDir = "asc" | "desc";

export default function AdminStudentsPage() {
  const { students, classes, addStudent, updateStudent, deleteStudent, addStudentsBulk } = useStore();

  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [faceFilter, setFaceFilter] = useState<"all" | "registered" | "unregistered">("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editTarget, setEditTarget] = useState("");
  const [formData, setFormData] = useState({ name: "", nisn: "", username: "", password: "", kelas: "", jurusan: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Filtered + Sorted ─────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students
      .filter((s) => {
        if (s.isAlumni) return false; // Hide alumni from active students
        const matchSearch =
          s.name.toLowerCase().includes(q) ||
          s.nisn.includes(q) ||
          (s.username || "").toLowerCase().includes(q);
        const matchKelas = kelasFilter === "all" || s.kelas === kelasFilter;
        const matchFace =
          faceFilter === "all" ||
          (faceFilter === "registered" && s.faceDescriptor && s.faceDescriptor.length > 0) ||
          (faceFilter === "unregistered" && (!s.faceDescriptor || s.faceDescriptor.length === 0));
        return matchSearch && matchKelas && matchFace;
      })
      .sort((a, b) => {
        const va = a[sortField] ?? "";
        const vb = b[sortField] ?? "";
        const cmp = va.localeCompare(vb, "id");
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [students, search, kelasFilter, faceFilter, sortField, sortDir]);

  /* ── Pagination ─────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
    setSelected(new Set());
  };

  /* ── Sort helper ────────────────────────────── */
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };
  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronUp size={12} style={{ opacity: 0.25 }} />;

  /* ── Select helpers ─────────────────────────── */
  const allSelected = paginated.length > 0 && paginated.every((s) => selected.has(s.id));
  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      paginated.forEach((s) => next.delete(s.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      paginated.forEach((s) => next.add(s.id));
      setSelected(next);
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const bulkDelete = () => {
    if (!window.confirm(`Hapus ${selected.size} siswa yang dipilih?`)) return;
    selected.forEach((id) => deleteStudent(id));
    setSelected(new Set());
  };

  /* ── CRUD ───────────────────────────────────── */
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateStudent(editTarget, { name: formData.name, username: formData.username, password: formData.password, nisn: formData.nisn, kelas: formData.kelas, jurusan: formData.jurusan });
    } else {
      addStudent({ id: uuidv4(), name: formData.name, username: formData.username, password: formData.password, role: "siswa", nisn: formData.nisn, kelas: formData.kelas, jurusan: formData.jurusan, isActive: true, createdAt: new Date().toISOString() });
      setPage(1);
    }
    setFormData({ name: "", nisn: "", username: "", password: "", kelas: "", jurusan: "" });
    setShowModal(false);
  };
  const openAdd = () => { setIsEdit(false); setFormData({ name: "", nisn: "", username: "", password: "", kelas: "", jurusan: "" }); setShowModal(true); };
  const openEdit = (s: Student) => { setIsEdit(true); setEditTarget(s.id); setFormData({ name: s.name, nisn: s.nisn, username: s.username, password: s.password, kelas: s.kelas, jurusan: s.jurusan }); setShowModal(true); };
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus siswa ${name}?`)) {
      deleteStudent(id);
    }
  };

  const handleResetDevice = (id: string, name: string) => {
    if (confirm(`Yakin ingin mereset Device Binding untuk siswa ${name}? Siswa harus login ulang dari perangkat barunya.`)) {
      updateStudent(id, { deviceId: undefined });
      alert(`Device Binding untuk ${name} berhasil direset.`);
    }
  };

  const handleResetFace = (id: string, name: string) => {
    if (confirm(`Yakin ingin mereset data Wajah (Face ID) untuk siswa ${name}? Siswa harus merekam ulang wajahnya saat absen berikutnya.`)) {
      updateStudent(id, { faceDescriptor: [] });
      alert(`Face ID untuk ${name} berhasil direset.`);
    }
  };

  /* ── Excel ──────────────────────────────────── */
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ Nama: "Budi Santoso", NISN: "123456789", Username: "budi.s", Password: "password123", Kelas: "XII IPA 1", Jurusan: "IPA" }]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Siswa.xlsx");
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
      addStudentsBulk(data.map(d => ({ id: uuidv4(), name: d.Nama, nisn: String(d.NISN), username: d.Username, password: d.Password || "password123", kelas: d.Kelas, jurusan: d.Jurusan, role: "siswa", isActive: true, createdAt: new Date().toISOString() })));
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };
  const exportData = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(s => ({ Nama: s.name, NISN: s.nisn, Kelas: s.kelas, Jurusan: s.jurusan, Username: s.username, "Face ID": s.faceDescriptor?.length ? "Terdaftar" : "Belum", Status: s.isActive ? "Aktif" : "Non-aktif" })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, "Data_Siswa.xlsx");
  };

  const unregisteredCount = students.filter(s => !s.faceDescriptor?.length).length;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Manajemen Siswa</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {students.length} siswa terdaftar
            {unregisteredCount > 0 && (
              <span style={{ marginLeft: 8, color: "#f59e0b", fontWeight: 600 }}>
                · {unregisteredCount} belum Face ID
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={downloadTemplate} className="btn-secondary" style={{ fontSize: 13 }}>
            <FileSpreadsheet size={15} /> Template
          </button>
          <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ fontSize: 13, color: "#10b981", borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)" }}>
            <Upload size={15} /> Import Excel
          </button>
          <button onClick={exportData} className="btn-secondary" style={{ fontSize: 13 }}>
            <Download size={15} /> Export
          </button>
          <button
            onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin menaikkan semua siswa? Siswa kelas XII akan menjadi alumni, dan kelas X, XI akan naik setingkat.")) {
                useStore.getState().promoteStudents();
              }
            }}
            className="btn-secondary"
            style={{ fontSize: 13, color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.1)" }}
          >
            <ChevronUp size={15} /> Naik Kelas
          </button>
          <button onClick={openAdd} className="btn-primary" style={{ fontSize: 13 }}>
            <Plus size={15} /> Tambah Siswa
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Cari nama, NISN, username..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field" style={{ width: "auto", minWidth: 150 }} value={kelasFilter} onChange={(e) => { setKelasFilter(e.target.value); setPage(1); }}>
          <option value="all">Semua Kelas</option>
          {classes.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="input-field" style={{ width: "auto", minWidth: 170 }} value={faceFilter} onChange={(e) => { setFaceFilter(e.target.value as any); setPage(1); }}>
          <option value="all">Semua Face ID</option>
          <option value="registered">✅ Sudah Terdaftar</option>
          <option value="unregistered">❌ Belum Terdaftar</option>
        </select>
        <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {filtered.length} hasil
        </span>
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "var(--radius-md)", padding: "10px 16px" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-primary)" }}>
            {selected.size} siswa dipilih
          </span>
          <button onClick={bulkDelete} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#ef4444", fontSize: 13, fontWeight: 600 }}>
            <Trash size={14} /> Hapus Dipilih
          </button>
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 13 }}>
            Batal
          </button>
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", color: allSelected ? "var(--accent-primary)" : "var(--text-muted)", display: "flex" }}>
                    {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th style={{ width: 40 }}>No</th>
                <th onClick={() => handleSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>Nama <SortIcon field="name" /></span>
                </th>
                <th onClick={() => handleSort("nisn")} style={{ cursor: "pointer", userSelect: "none" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>NISN <SortIcon field="nisn" /></span>
                </th>
                <th onClick={() => handleSort("kelas")} style={{ cursor: "pointer", userSelect: "none" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>Kelas <SortIcon field="kelas" /></span>
                </th>
                <th onClick={() => handleSort("jurusan")} style={{ cursor: "pointer", userSelect: "none" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>Jurusan <SortIcon field="jurusan" /></span>
                </th>
                <th>Username</th>
                <th>Face ID</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s, i) => (
                <tr key={s.id} style={{ background: selected.has(s.id) ? "rgba(99,102,241,0.06)" : undefined }}>
                  <td>
                    <button onClick={() => toggleOne(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: selected.has(s.id) ? "var(--accent-primary)" : "var(--text-muted)", display: "flex" }}>
                      {selected.has(s.id) ? <CheckSquare size={15} /> : <Square size={15} />}
                    </button>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>
                        {s.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>{s.nisn}</td>
                  <td>{s.kelas}</td>
                  <td>{s.jurusan}</td>
                  <td style={{ fontSize: 12 }}>{s.username}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {s.faceDescriptor?.length ? (
                        <span className="badge badge-success"><UserCheck size={10} /> Face terdaftar</span>
                      ) : (
                        <span className="badge badge-danger">Face belum</span>
                      )}
                      {s.deviceId ? (
                        <span className="badge badge-success" title={s.deviceId}><Smartphone size={10} /> Device terikat</span>
                      ) : (
                        <span className="badge badge-danger">Device belum</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${s.isActive ? "badge-success" : "badge-danger"}`}>
                      {s.isActive ? "Aktif" : "Non-aktif"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {s.faceDescriptor?.length ? (
                        <button title="Reset Face ID" onClick={() => handleResetFace(s.id, s.name)} style={{ background: "rgba(16,185,129,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#10b981" }}>
                          <UserCheck size={13} />
                        </button>
                      ) : null}
                      {s.deviceId && (
                        <button title="Reset Device Binding" onClick={() => handleResetDevice(s.id, s.name)} style={{ background: "rgba(245,158,11,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#f59e0b" }}>
                          <Smartphone size={13} />
                        </button>
                      )}
                      <button onClick={() => openEdit(s)} style={{ background: "rgba(99,102,241,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#6366f1" }}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(s.id, s.name)} style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#ef4444" }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
            Tidak ada siswa ditemukan
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid var(--border-glass)", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length} siswa
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
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                const p = start + i;
                return (
                  <button key={p} onClick={() => goPage(p)}
                    style={{ background: p === safePage ? "var(--gradient-primary)" : "var(--bg-glass)", border: `1px solid ${p === safePage ? "transparent" : "var(--border-glass)"}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: p === safePage ? "white" : "var(--text-secondary)", fontWeight: p === safePage ? 700 : 400, fontSize: 13 }}>
                    {p}
                  </button>
                );
              })}
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

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-card" style={{ width: 420, padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{isEdit ? "Edit Siswa" : "Tambah Siswa Baru"}</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                {[
                  { label: "Nama Lengkap", key: "name", type: "text" },
                  { label: "NISN", key: "nisn", type: "text" },
                  { label: "Username", key: "username", type: "text" },
                  { label: "Password", key: "password", type: "text" },
                  { label: "Jurusan", key: "jurusan", type: "text" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>{label}</label>
                    <input type={type} className="input-field" value={(formData as any)[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} required />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Kelas</label>
                  <select className="input-field" value={formData.kelas} onChange={(e) => setFormData({ ...formData, kelas: e.target.value })} required>
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((k) => <option key={k} value={k}>{k}</option>)}
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
