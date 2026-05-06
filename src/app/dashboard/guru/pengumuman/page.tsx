"use client";
import { useStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { Megaphone, Bell, AlertTriangle, Info, Calendar } from "lucide-react";
import { AnnouncementPriority } from "@/lib/types";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const PRIORITY_CONFIG: Record<AnnouncementPriority, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  normal:  { label: "Normal",  color: "#3b82f6", bg: "rgba(59,130,246,0.08)",  icon: Info },
  penting: { label: "Penting", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  icon: Bell },
  darurat: { label: "Darurat", color: "#ef4444", bg: "rgba(239,68,68,0.08)",   icon: AlertTriangle },
};

export default function GuruPengumumanPage() {
  const { currentUser, getAnnouncementsForUser } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!currentUser || !mounted) return null;

  const teacher = currentUser as import("@/lib/types").Teacher;
  const announcements = getAnnouncementsForUser(currentUser.role, teacher.kelasWali)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
          <Megaphone size={24} color="var(--accent-primary)" /> Pengumuman
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Pengumuman resmi dari sekolah untuk Anda.</p>
      </div>

      {announcements.length === 0 ? (
        <div className="glass-card" style={{ padding: 64, textAlign: "center", color: "var(--text-muted)" }}>
          <Megaphone size={56} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Tidak ada pengumuman</div>
          <div style={{ fontSize: 14 }}>Pengumuman terbaru dari sekolah akan tampil di sini.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {announcements.map(ann => {
            const cfg = PRIORITY_CONFIG[ann.priority];
            const Icon = cfg.icon;
            return (
              <div key={ann.id} className="glass-card" style={{ padding: 24, borderLeft: `4px solid ${cfg.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
                    padding: "3px 10px", borderRadius: 12, background: cfg.bg, color: cfg.color }}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
                    <Calendar size={12} />
                    {format(new Date(ann.publishedAt), "EEEE, dd MMMM yyyy HH:mm", { locale: idLocale })}
                  </div>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{ann.title}</h2>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{ann.content}</p>
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-muted)" }}>
                  Dari: {ann.authorName}
                  {ann.expiresAt && ` · Berlaku hingga: ${format(new Date(ann.expiresAt), "dd MMM yyyy", { locale: idLocale })}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
