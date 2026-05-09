"use client";
import { useStore } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { sendPushNotification } from "@/lib/notifications";
import { InAppNotification } from "@/lib/types";

const TYPE_ICON: Record<string, React.ElementType> = {
  info: Info, warning: AlertTriangle, success: CheckCircle, danger: XCircle,
};

const TYPE_COLOR: Record<string, string> = {
  info: "#3b82f6", warning: "#f59e0b", success: "#10b981", danger: "#ef4444",
};

export default function NotificationBell() {
  const { currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<InAppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Ambil notifikasi dari Database API
  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setNotifs(data.data);
      }
    } catch (e) {
      console.error("Gagal fetch notif:", e);
    }
  };

  useEffect(() => {
     
    fetchNotifications();
    // Auto-refresh notif setiap 30 detik
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const unreadCount = notifs.filter(n => !n.isRead).length;
  const prevUnread = useRef(unreadCount);

  // Memicu notifikasi sistem (native push notification) jika ada notif baru
  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      const newNotif = notifs.find(n => !n.isRead);
      if (newNotif) {
        sendPushNotification(newNotif.title, newNotif.message);
      }
    }
    prevUnread.current = unreadCount;
  }, [unreadCount, notifs]);

  if (!currentUser) return null;

  const markAsRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifId: id }),
    });
  };

  const markAllAsRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id }),
    });
  };

  const unread = unreadCount;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} id="btn-notification-bell"
        style={{ position: "relative", background: open ? "rgba(99,102,241,0.15)" : "var(--bg-glass)",
          border: "1px solid var(--border-glass)", borderRadius: 10,
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-primary)", transition: "all 0.2s" }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "var(--bg-glass)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "var(--bg-glass)"; }}>
        <Bell size={18} />
        {unread > 0 && (
          <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%",
            background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "white", border: "2px solid var(--bg-secondary)" }}>
            {unread > 9 ? "9+" : unread}
          </div>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 340,
          background: "#0f1629", border: "1px solid var(--border-glass)", borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 999, overflow: "hidden",
          animation: "fadeInUp 0.2s ease" }}>
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-glass)",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Notifikasi {unread > 0 && <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>({unread} baru)</span>}
            </div>
            {unread > 0 && (
              <button onClick={() => markAllAsRead()}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-primary)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCheck size={14} /> Baca semua
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifs.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                <Bell size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                <div>Belum ada notifikasi</div>
              </div>
            ) : (
              notifs.map(n => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                return (
                  <div key={n.id}
                    onClick={() => markAsRead(n.id)}
                    style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)",
                      background: n.isRead ? "transparent" : "rgba(99,102,241,0.04)",
                      cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? "transparent" : "rgba(99,102,241,0.04)")}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: `${TYPE_COLOR[n.type]}15`,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={15} color={TYPE_COLOR[n.type]} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                          {new Date(n.createdAt).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                        </div>
                      </div>
                      {!n.isRead && (
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: 4 }} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
