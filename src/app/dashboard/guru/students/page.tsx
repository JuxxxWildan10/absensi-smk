"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Search, UserCheck } from "lucide-react";

export default function GuruStudentsPage() {
  const { students, currentUser } = useStore();
  const [search, setSearch] = useState("");

  const teacher = currentUser as import("@/lib/types").Teacher;
  const myKelas = teacher?.kelasWali ?? "";

  const myStudents = students.filter((s) => s.kelas === myKelas);
  const filtered = myStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.nisn.includes(search)
  );

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Daftar Siswa</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Kelas {myKelas} • {myStudents.length} siswa</p>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 20, maxWidth: 300 }}>
        <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input className="input-field" style={{ paddingLeft: 38 }}
          placeholder="Cari nama atau NISN..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>No</th><th>Nama</th><th>NISN</th><th>Email</th><th>Face ID</th></tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-primary)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
                        {s.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace" }}>{s.nisn}</td>
                  <td>{s.email}</td>
                  <td>
                    {s.faceDescriptor ? (
                      <span className="badge badge-success"><UserCheck size={10} /> Terdaftar</span>
                    ) : (
                      <span className="badge badge-danger">Belum</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Siswa tidak ditemukan</div>
        )}
      </div>
    </div>
  );
}
