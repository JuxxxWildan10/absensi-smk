"use client";
import { useStore } from "@/lib/store";
import { DUMMY_PARENTS, DUMMY_STUDENTS } from "@/lib/data";
import { Bell, AlertTriangle, CheckCircle } from "lucide-react";

export default function WaliNotifPage() {
  const { currentUser, notifications } = useStore();
  if (!currentUser) return null;

  const parent = DUMMY_PARENTS.find((p) => p.id === currentUser.id);
  const studentIds = parent?.studentIds ?? [];
  const myNotifs = notifications.filter((n) => studentIds.includes(n.studentId));

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Notifikasi Saya</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>{myNotifs.length} notifikasi diterima</p>

      <div className="glass-card" style={{ padding: 24 }}>
        {myNotifs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#10b981" }}>
            <CheckCircle size={48} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700 }}>Tidak Ada Notifikasi 🎉</div>
            <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>Anak Anda selalu hadir tepat waktu</div>
          </div>
        ) : (
          myNotifs.map((n) => {
            const student = DUMMY_STUDENTS.find((s) => s.id === n.studentId);
            return (
              <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 14,
                padding: "16px 0", borderBottom: "1px solid var(--border-glass)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {student?.name ?? "Siswa"} — Tidak Hadir
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 6 }}>
                    {n.message}
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)" }}>
                    <span>{new Date(n.sentAt).toLocaleString("id-ID")}</span>
                    <span style={{ textTransform: "capitalize", padding: "1px 8px", borderRadius: 10,
                      background: n.type === "push" ? "rgba(99,102,241,0.15)"
                        : n.type === "whatsapp" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                      color: n.type === "push" ? "#6366f1" : n.type === "whatsapp" ? "#10b981" : "#3b82f6" }}>
                      {n.type}
                    </span>
                    <span style={{ color: n.status === "sent" ? "#10b981" : "#ef4444" }}>
                      {n.status === "sent" ? "✓ Diterima" : "✗ Gagal"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
