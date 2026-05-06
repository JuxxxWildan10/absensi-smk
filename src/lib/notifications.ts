// ============================================================
// AbsensiCerdas - Notification Service
// ============================================================

import { NotificationLog, NotificationPayload } from "./types";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

/**
 * Request push notification permission
 * Meminta izin dari browser pengguna untuk dapat memunculkan notifikasi (Push Notification).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Send browser push notification (PWA)
 * Mengirim notifikasi popup ke perangkat pengguna memanfaatkan Service Worker (PWA feature).
 */
export async function sendPushNotification(
  title: string,
  body: string,
  icon = "/icons/icon-192x192.png"
): Promise<boolean> {
  try {
    if (Notification.permission !== "granted") {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }

    if ("serviceWorker" in navigator) {
      const sw = await navigator.serviceWorker.ready;
      await sw.showNotification(title, {
        body,
        icon,
        badge: "/icons/icon-72x72.png",
        vibrate: [200, 100, 200],
        tag: "absensi-notif",
        requireInteraction: true,
      } as NotificationOptions & { vibrate?: number[] });
      return true;
    }

    // Fallback
    new Notification(title, { body, icon });
    return true;
  } catch {
    return false;
  }
}

/**
 * Build absent notification message
 * Membangun format teks pesan otomatis untuk orang tua ketika anak absen.
 */
export function buildAbsentMessage(payload: NotificationPayload): string {
  const dateFormatted = format(new Date(payload.date), "EEEE, dd MMMM yyyy", {
    locale: idLocale,
  });
  return `Anak Anda, ${payload.studentName} (Kelas ${payload.kelas}), tidak melakukan absensi hari ini (${dateFormatted}). Mohon konfirmasi kehadiran anak Anda.`;
}

/**
 * Build WhatsApp URL (wa.me) for manual trigger or API
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

/**
 * Simulate sending email notification (in production, use Nodemailer/SendGrid)
 */
export async function sendEmailNotification(
  to: string,
  studentName: string,
  kelas: string,
  date: string
): Promise<boolean> {
  // In real implementation, call /api/notifications/email
  const res = await fetch("/api/notifications/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, studentName, kelas, date }),
  });
  return res.ok;
}

/**
 * Create a notification log entry
 */
export function createNotificationLog(
  studentId: string,
  parentId: string,
  type: "push" | "whatsapp" | "email",
  message: string,
  attendanceId: string,
  status: "sent" | "failed" | "pending" = "sent"
): NotificationLog {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    studentId,
    parentId,
    type,
    message,
    sentAt: new Date().toISOString(),
    status,
    attendanceId,
  };
}

/**
 * Check if it's past the check-in deadline for today
 */
export function isPastCheckInDeadline(checkInEnd: string): boolean {
  const [endH, endM] = checkInEnd.split(":").map(Number);
  const now = new Date();
  return now.getHours() > endH || (now.getHours() === endH && now.getMinutes() >= endM);
}

/**
 * Get attendance status based on check-in time
 */
export function getAttendanceStatus(
  checkInTime: string,
  checkInEnd: string
): "hadir" | "terlambat" {
  const [endH, endM] = checkInEnd.split(":").map(Number);
  const [inH, inM] = checkInTime.split(":").map(Number);
  const isLate = inH > endH || (inH === endH && inM > endM);
  return isLate ? "terlambat" : "hadir";
}
