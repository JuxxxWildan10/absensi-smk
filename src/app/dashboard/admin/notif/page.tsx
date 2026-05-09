"use client";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, MessageCircle, Mail, Send } from "lucide-react";
import { DUMMY_PARENTS, DUMMY_STUDENTS } from "@/lib/data";
import {
  buildAbsentMessage, buildWhatsAppUrl,
  createNotificationLog, sendPushNotification
} from "@/lib/notifications";
import Toast, { ToastType } from "@/components/Toast";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ToastState { message: string; type: ToastType }

export default function AdminNotifPage() {
  const { students, records, notifications, addNotification } = useStore();
  const [toast, setToast]   = useState<ToastState | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

   
   
   
  useEffect(() => setMounted(true), []);

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.date === today);

  // Find absent students today
  const absentStudents = students.filter((s) => {
    const record = todayRecords.find((r) => r.studentId === s.id);
    return !record || record.status === "tidak_hadir";
  });

  const sendNotification = async (studentId: string, type: "push" | "whatsapp" | "email") => {
    setSending(`${studentId}-${type}`);
    const student = DUMMY_STUDENTS.find((s) => s.id === studentId);
    if (!student) return;
    const parent = DUMMY_PARENTS.find((p) => p.id === student.parentId);
    if (!parent) { setToast({ message: "Wali murid tidak ditemukan", type: "error" }); setSending(null); return; }

    const msg = buildAbsentMessage({ studentName: student.name, kelas: student.kelas,
      date: today, status: "tidak_hadir" });
    const attendanceId = `att-${studentId}-${today}`;

    if (type === "push") {
      await sendPushNotification("⚠️ Siswa Tidak Hadir", msg);
    } else if (type === "whatsapp") {
      if (parent.waNumber) {
        window.open(buildWhatsAppUrl(parent.waNumber, msg), "_blank");
      }
    } else {
      await fetch("/api/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: parent.email, studentName: student.name, kelas: student.kelas, date: today }),
      });
    }

    const logEntry = createNotificationLog(studentId, parent.id, type, msg, attendanceId, "sent");
    addNotification(logEntry);
    setToast({ message: `Notifikasi ${type} berhasil dikirim ke ${parent.name}`, type: "success" });
    setSending(null);
  };

  const sendAllNotifications = async () => {
    setToast({ message: "Sedang mengirim notifikasi ke semua siswa yang belum absen...", type: "info" });
    try {
      const res = await fetch("/api/cron/check-absentees?force=true", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setToast({ message: data.message || "Notifikasi berhasil dikirim!", type: "success" });
      } else {
        setToast({ message: data.message || "Gagal mengirim notifikasi", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Terjadi kesalahan server", type: "error" });
    }
  };

  if (!mounted) return null;

  return (
    <div className="animate-fadeIn">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Pusat Notifikasi</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: idLocale })}
          </p>
        </div>
        {absentStudents.length > 0 && (
          <button onClick={sendAllNotifications} className="btn-primary">
            <Send size={15} /> Kirim Semua Notifikasi ({absentStudents.length})
          </button>
        )}
      </div>

      {/* Absent students */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={18} color="#f59e0b" />
          Siswa Belum Absen Hari Ini ({absentStudents.length})
        </div>

        {absentStudents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#10b981" }}>
            <CheckCircle size={40} style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 600 }}>Semua siswa sudah absen hari ini 🎉</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {absentStudents.map((s) => {
              const parent = DUMMY_PARENTS.find((p) => p.id === s.parentId);
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-md)",
                  flexWrap: "wrap" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%",
                    background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#ef4444", flexShrink: 0 }}>
                    {s.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {s.kelas} • Wali: {parent?.name ?? "–"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => sendNotification(s.id, "push")}
                      disabled={sending === `${s.id}-push`}
                      style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                        borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#6366f1",
                        fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Bell size={12} /> Push
                    </button>
                    {parent?.waNumber && (
                      <button onClick={() => sendNotification(s.id, "whatsapp")}
                        style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                          borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#10b981",
                          fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        <MessageCircle size={12} /> WhatsApp
                      </button>
                    )}
                    <button onClick={() => sendNotification(s.id, "email")}
                      style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
                        borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#3b82f6",
                        fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Mail size={12} /> Email
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification log */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={18} color="var(--accent-primary)" /> Log Notifikasi ({notifications.length})
        </div>
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: 14 }}>
            Belum ada notifikasi
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr><th>Waktu</th><th>Pesan</th><th>Tipe</th><th>Status</th></tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                      {new Date(n.sentAt).toLocaleString("id-ID")}
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 320 }}>{n.message}</td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize",
                        padding: "2px 8px", borderRadius: 10,
                        background: n.type === "push" ? "rgba(99,102,241,0.15)"
                          : n.type === "whatsapp" ? "rgba(16,185,129,0.15)"
                          : "rgba(59,130,246,0.15)",
                        color: n.type === "push" ? "#6366f1"
                          : n.type === "whatsapp" ? "#10b981" : "#3b82f6" }}>
                        {n.type}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: n.status === "sent" ? "#10b981" : "#ef4444", fontSize: 12, fontWeight: 600 }}>
                        {n.status === "sent" ? "✓ Terkirim" : "✗ Gagal"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
