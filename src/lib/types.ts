// ============================================================
// AbsensiCerdas - Core Type Definitions
// ============================================================

export type UserRole = "admin" | "guru" | "siswa" | "wali";

// Tipe data dasar untuk entitas pengguna (User) di sistem
export interface User {
  id: string;
  name: string;
  username: string;
  password: string; // hashed
  role: UserRole;
  avatar?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  isActive: boolean;
}

// Tipe data spesifik untuk Siswa (mewarisi semua properti dari User)
export interface Student extends User {
  role: "siswa";
  nisn: string;
  kelas: string;
  jurusan: string;
  faceDescriptor?: number[]; // stored face embedding
  parentId?: string;
  isAlumni?: boolean;
  graduationYear?: number;
  deviceId?: string; // Kunci perangkat untuk fitur Device Binding
}

// Tipe data spesifik untuk Guru (mewarisi properti User)
export interface Teacher extends User {
  role: "guru";
  nip: string;
  mataPelajaran: string[];
  kelasWali?: string;
}

// Tipe data spesifik untuk Wali Murid
export interface Parent extends User {
  role: "wali";
  studentIds: string[];
  waNumber?: string; // WhatsApp number
}

export interface Admin extends User {
  role: "admin";
}

export interface School {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters (50-100m)
  checkInStart: string; // "07:00"
  checkInEnd: string;   // "08:00"
  checkOutStart: string;
  checkOutEnd: string;
}

export type AttendanceStatus = "hadir" | "terlambat" | "tidak_hadir" | "izin" | "sakit";

// Tipe data untuk merepresentasikan satu rekam absensi harian siswa
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  kelas: string;
  date: string; // ISO date string YYYY-MM-DD
  checkIn?: {
    time: string;
    latitude: number;
    longitude: number;
    faceVerified: boolean;
    locationVerified: boolean;
  };
  checkOut?: {
    time: string;
    latitude: number;
    longitude: number;
  };
  status: AttendanceStatus;
  notes?: string;
}

export interface NotificationLog {
  id: string;
  studentId: string;
  parentId: string;
  type: "push" | "whatsapp" | "email";
  message: string;
  sentAt: string;
  status: "sent" | "failed" | "pending";
  attendanceId: string;
}

export interface GeofenceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  attendanceRate: number;
  weeklyData: { day: string; hadir: number; terlambat: number; tidak_hadir: number }[];
}

export interface ClassData {
  id: string;
  name: string; // e.g. "XII IPA 1"
  jurusan: string;
  teacherId: string;
  studentIds: string[];
}

export interface NotificationPayload {
  studentName: string;
  kelas: string;
  date: string;
  status: AttendanceStatus;
  parentPhone?: string;
  parentEmail?: string;
}

// ── NEW: Surat Izin / Dispensasi ──────────────────────────
export type PermitType = "izin" | "sakit" | "dispensasi";
export type PermitStatus = "pending" | "approved" | "rejected";

export interface PermitRequest {
  id: string;
  studentId: string;
  studentName: string;
  kelas: string;
  type: PermitType;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
  status: PermitStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

// ── NEW: Audit Log ─────────────────────────────────────────
export type AuditAction =
  | "LOGIN" | "LOGOUT"
  | "TAMBAH_SISWA" | "EDIT_SISWA" | "HAPUS_SISWA"
  | "TAMBAH_GURU" | "EDIT_GURU" | "HAPUS_GURU"
  | "TAMBAH_KELAS" | "EDIT_KELAS" | "HAPUS_KELAS"
  | "APPROVE_IZIN" | "REJECT_IZIN"
  | "KIRIM_NOTIFIKASI"
  | "EDIT_PENGATURAN"
  | "EDIT_PROFIL"
  | "TAMBAH_PENGUMUMAN" | "HAPUS_PENGUMUMAN"
  | "TAMBAH_EVENT" | "HAPUS_EVENT"
  | "ABSENSI_MASUK" | "ABSENSI_KELUAR"
  | "NAIK_KELAS";

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: AuditAction;
  target?: string;
  detail?: string;
  timestamp: string;
}

// ── NEW: Announcement / Pengumuman ────────────────────────
export type AnnouncementPriority = "normal" | "penting" | "darurat";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRoles: UserRole[];
  targetKelas?: string[];
  priority: AnnouncementPriority;
  publishedAt: string;
  expiresAt?: string;
  authorId: string;
  authorName: string;
}

// ── NEW: Academic Calendar Event ──────────────────────────
export type EventType = "libur_nasional" | "libur_sekolah" | "ujian" | "kegiatan" | "rapat";

export interface AcademicEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: EventType;
  description?: string;
  createdBy: string;
}

// ── NEW: Subject Attendance (per mapel) ───────────────────
export interface SubjectAttendanceRecord {
  id: string;
  subjectName: string;
  teacherId: string;
  kelas: string;
  date: string;
  session: number; // pertemuan ke-
  presentStudentIds: string[];
  absentStudentIds: string[];
  notes?: string;
  createdAt: string;
}

// ── NEW: Class Schedule (Jadwal Pelajaran) ────────────────
export interface ClassSchedule {
  id: string;
  kelas: string;
  day: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
  startTime: string; // "07:00"
  endTime: string;   // "08:30"
  subjectName: string;
  teacherId: string;
}

// ── NEW: In-App Notification ──────────────────────────────
export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "danger";
  isRead: boolean;
  link?: string;
  createdAt: string;
}
