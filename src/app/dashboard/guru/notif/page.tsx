"use client";
import { useStore } from "@/lib/store";
import { DUMMY_STUDENTS } from "@/lib/data";
import { Bell, AlertTriangle } from "lucide-react";

export default function GuruNotifPage() {
  const { notifications, currentUser } = useStore();
  const teacher = currentUser as import("@/lib/types").Teacher;
  const myKelas = teacher?.kelasWali ?? "";

  const myStudents = DUMMY_STUDENTS.filter((s) => s.kelas === myKelas);
  const myStudentIds = myStudents.map((s) => s.id);

  const myNotifs = notifications.filter((n) => myStudentIds.includes(n.studentId));

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Notifikasi Wali Murid</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>Log pengiriman untuk Kelas {myKelas}</p>

      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={18} color="var(--accent-primary)" /> Log Pengiriman ({myNotifs.length})
        </div>

        {myNotifs.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>Belum ada log notifikasi.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr><th>Waktu</th><th>Siswa</th><th>Pesan</th><th>Tipe</th><th>Status</th></tr>
              </thead>
              <tbody>
                {myNotifs.map((n) => {
                  const student = myStudents.find((s) => s.id === n.studentId);
                  return (
                    <tr key={n.id}>
                      <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>{new Date(n.sentAt).toLocaleString("id-ID")}</td>
                      <td style={{ fontWeight: 500 }}>{student?.name}</td>
                      <td style={{ fontSize: 12, maxWidth: 260 }}>{n.message}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", padding: "2px 8px", borderRadius: 10,
                          background: n.type === "push" ? "rgba(99,102,241,0.15)" : n.type === "whatsapp" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                          color: n.type === "push" ? "#6366f1" : n.type === "whatsapp" ? "#10b981" : "#3b82f6" }}>
                          {n.type}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: n.status === "sent" ? "#10b981" : "#ef4444", fontSize: 12, fontWeight: 600 }}>
                          {n.status === "sent" ? "✓ Terkirim" : "✗ Gagal"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
