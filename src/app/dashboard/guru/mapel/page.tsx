"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { BookOpen, Plus, Save, Users, ClipboardList, CheckCircle, XCircle } from "lucide-react";
import { SubjectAttendanceRecord } from "@/lib/types";
import Toast, { ToastType } from "@/components/Toast";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";

export default function GuruMapelPage() {
  const { currentUser, students, subjectRecords, addSubjectRecord, getSubjectRecordsByTeacher } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [form, setForm] = useState({
    subjectName: "",
    date: new Date().toISOString().split("T")[0],
    session: 1,
    presentStudentIds: [] as string[],
    notes: "",
  });

  if (!currentUser) return null;
  const teacher = currentUser as import("@/lib/types").Teacher;
  const myKelas = teacher.kelasWali || "";
  const myStudents = students.filter(s => s.kelas === myKelas);
  const mySubjects = teacher.mataPelajaran || [];
  const myRecords = getSubjectRecordsByTeacher(currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const togglePresent = (studentId: string) => {
    setForm(f => ({
      ...f,
      presentStudentIds: f.presentStudentIds.includes(studentId)
        ? f.presentStudentIds.filter(id => id !== studentId)
        : [...f.presentStudentIds, studentId],
    }));
  };

  const handleSelectAll = () => {
    setForm(f => ({
      ...f,
      presentStudentIds: f.presentStudentIds.length === myStudents.length ? [] : myStudents.map(s => s.id),
    }));
  };

  const handleSubmit = () => {
    if (!form.subjectName) {
      setToast({ message: "Pilih mata pelajaran terlebih dahulu", type: "error" });
      return;
    }
    const record: SubjectAttendanceRecord = {
      id: uuidv4(),
      subjectName: form.subjectName,
      teacherId: currentUser.id,
      kelas: myKelas,
      date: form.date,
      session: form.session,
      presentStudentIds: form.presentStudentIds,
      absentStudentIds: myStudents.filter(s => !form.presentStudentIds.includes(s.id)).map(s => s.id),
      notes: form.notes,
      createdAt: new Date().toISOString(),
    };
    addSubjectRecord(record);
    setToast({ message: `Absensi ${form.subjectName} berhasil disimpan!`, type: "success" });
    setShowForm(false);
    setForm({ subjectName: "", date: new Date().toISOString().split("T")[0], session: 1, presentStudentIds: [], notes: "" });
  };

  // Summary per subject
  const subjectSummary = mySubjects.map(subj => {
    const recs = myRecords.filter(r => r.subjectName === subj);
    const totalSessions = recs.length;
    const avgPresent = totalSessions > 0
      ? Math.round(recs.reduce((s, r) => s + r.presentStudentIds.length, 0) / totalSessions)
      : 0;
    return { subjectName: subj, totalSessions, avgPresent };
  });

  return (
    <div className="animate-fadeIn">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Absensi per Mata Pelajaran</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Kelas: <strong style={{ color: "var(--text-primary)" }}>{myKelas}</strong> · Catat kehadiran per sesi pertemuan.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} id="btn-catat-absensi-mapel">
          <Plus size={16} /> Catat Absensi
        </button>
      </div>

      {/* Subject summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {subjectSummary.map(s => (
          <div key={s.subjectName} className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--gradient-primary)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={18} color="white" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{s.subjectName}</div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#6366f1" }}>{s.totalSessions}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Sesi</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{s.avgPresent}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Rata² Hadir</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Records list */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardList size={18} color="var(--accent-primary)" /> Riwayat Absensi per Pertemuan
        </div>
        {myRecords.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
            <BookOpen size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div>Belum ada data absensi per mata pelajaran</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Klik "Catat Absensi" untuk memulai</div>
          </div>
        ) : (
          myRecords.map(rec => {
            const classStudents = students.filter(s => s.kelas === rec.kelas);
            const presentStudents = classStudents.filter(s => rec.presentStudentIds.includes(s.id));
            const absentStudents = classStudents.filter(s => rec.absentStudentIds.includes(s.id));
            const rate = classStudents.length > 0 ? Math.round((presentStudents.length / classStudents.length) * 100) : 0;
            return (
              <div key={rec.id} style={{ padding: 16, background: "var(--bg-glass)", borderRadius: 12, marginBottom: 12, border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{rec.subjectName}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {format(new Date(rec.date), "EEEE, dd MMM yyyy", { locale: idLocale })} · Pertemuan ke-{rec.session}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: rate >= 75 ? "#10b981" : "#ef4444" }}>{rate}%</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Kehadiran</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={12} /> Hadir ({presentStudents.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {presentStudents.map(s => (
                        <span key={s.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <XCircle size={12} /> Tidak Hadir ({absentStudents.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {absentStudents.map(s => (
                        <span key={s.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {rec.notes && <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>📝 {rec.notes}</div>}
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={18} color="var(--accent-primary)" /> Catat Absensi Mata Pelajaran
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Mata Pelajaran</label>
                  <select className="input-field" value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))}
                    style={{ colorScheme: "dark" }}>
                    <option value="">Pilih mapel...</option>
                    {mySubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Kelas</label>
                  <select className="input-field" value={myKelas} onChange={() => {}} disabled title="Hanya kelas wali untuk versi mockup ini">
                    <option value={myKelas}>{myKelas}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Pertemuan ke-</label>
                  <input type="number" className="input-field" min={1} value={form.session}
                    onChange={e => setForm(f => ({ ...f, session: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Tanggal</label>
                <input type="date" className="input-field" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Siswa Hadir ({form.presentStudentIds.length}/{myStudents.length})
                  </label>
                  <button onClick={handleSelectAll} style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer", color: "var(--accent-primary)" }}>
                    {form.presentStudentIds.length === myStudents.length ? "Kosongkan" : "Pilih Semua"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                  {myStudents.map(s => (
                    <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                      borderRadius: 8, cursor: "pointer", fontSize: 13,
                      background: form.presentStudentIds.includes(s.id) ? "rgba(16,185,129,0.1)" : "var(--bg-glass)",
                      border: `1px solid ${form.presentStudentIds.includes(s.id) ? "rgba(16,185,129,0.3)" : "var(--border-glass)"}`,
                      transition: "all 0.15s" }}>
                      <input type="checkbox" checked={form.presentStudentIds.includes(s.id)}
                        onChange={() => togglePresent(s.id)} style={{ accentColor: "#10b981" }} />
                      <span style={{ color: form.presentStudentIds.includes(s.id) ? "#10b981" : "var(--text-secondary)" }}>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Catatan (opsional)</label>
                <textarea className="input-field" rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Contoh: Siswa terlambat karena hujan..." style={{ resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button className="btn-primary" onClick={handleSubmit} id="btn-simpan-absensi-mapel">
                  <Save size={16} /> Simpan Absensi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
