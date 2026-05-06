"use client";
import { AttendanceStatus } from "@/lib/types";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; cls: string; dot: string }> = {
  hadir:       { label: "Hadir",       cls: "badge-success", dot: "#10b981" },
  terlambat:   { label: "Terlambat",   cls: "badge-warning", dot: "#f59e0b" },
  tidak_hadir: { label: "Tidak Hadir", cls: "badge-danger",  dot: "#ef4444" },
  izin:        { label: "Izin",        cls: "badge-info",    dot: "#3b82f6" },
  sakit:       { label: "Sakit",       cls: "badge-purple",  dot: "#8b5cf6" },
};

interface StatusBadgeProps {
  status: AttendanceStatus;
  showDot?: boolean;
}

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.tidak_hadir;
  return (
    <span className={`badge ${cfg.cls}`}>
      {showDot && (
        <span style={{ width: 6, height: 6, borderRadius: "50%",
          background: cfg.dot, display: "inline-block" }} />
      )}
      {cfg.label}
    </span>
  );
}
