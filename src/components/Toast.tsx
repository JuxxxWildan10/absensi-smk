"use client";
import { useEffect, useRef } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const ICONS = { success: CheckCircle, error: XCircle, info: Info };
const COLORS = { success: "#10b981", error: "#ef4444", info: "#3b82f6" };

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onClose, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onClose, duration]);

  const Icon = ICONS[type];
  const color = COLORS[type];

  return (
    <div className={`toast ${type}`} role="alert">
      <Icon size={18} color={color} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 14 }}>{message}</span>
      <button onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
        <X size={16} />
      </button>
    </div>
  );
}
