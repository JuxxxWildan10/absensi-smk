"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Search, Download, Filter } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function GuruAttendancePage() {
  const { students, records, currentUser } = useStore();
  const teacher = currentUser as import("@/lib/types").Teacher;
  const myKelas  = teacher?.kelasWali ?? "";
  const [search, setSearch]   = useState("");
  const [dateFilter, setDate] = useState(new Date().toISOString().split("T")[0]);

  const myStudents = students.filter((s) => s.kelas === myKelas);
  const dateRecords = records.filter((r) => r.date === dateFilter && r.kelas === myKelas);

  const filteredStudents = myStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Rekap Absensi</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Kelas {myKelas}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => exportToPDF(dateRecords, `Absensi ${myKelas}`)} className="btn-secondary" style={{ fontSize: 13 }}>
            PDF
          </button>
          <button onClick={() => exportToExcel(dateRecords, `Absensi ${myKelas}`)} className="btn-primary" style={{ fontSize: 13 }}>
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input className="input-field" style={{ paddingLeft: 36 }} placeholder="Cari siswa..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <input className="input-field" type="date" value={dateFilter}
          onChange={(e) => setDate(e.target.value)} style={{ width: "auto", colorScheme: "dark" }} />
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr><th>No</th><th>Nama Siswa</th><th>Status</th><th>Jam Masuk</th><th>Jam Keluar</th><th>Verifikasi</th></tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, i) => {
                const rec = dateRecords.find((r) => r.studentId === s.id);
                return (
                  <tr key={s.id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{s.name}</td>
                    <td><StatusBadge status={rec?.status ?? "tidak_hadir"} /></td>
                    <td>{rec?.checkIn?.time ?? "–"}</td>
                    <td>{rec?.checkOut?.time ?? "–"}</td>
                    <td style={{ fontSize: 12 }}>
                      {rec?.checkIn ? <span style={{ color: "#10b981" }}>✓ Wajah & GPS</span> : <span style={{ color: "var(--text-muted)" }}>–</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
