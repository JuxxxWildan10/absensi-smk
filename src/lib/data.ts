// ============================================================
// AbsensiCerdas - Dummy / Seed Data
// ============================================================
import {
  User, Student, Teacher, Parent, Admin, AttendanceRecord, ClassData, School,
  NotificationLog, PermitRequest, AuditLog, Announcement, AcademicEvent,
  ClassSchedule
} from "./types";
import { ADDITIONAL_TEACHERS, DUMMY_SCHEDULES as _DUMMY_SCHEDULES } from "./generated_data";

// Konfigurasi dummy sekolah untuk pengujian (termasuk batas geofence dan jam aturan absensi)
export const SCHOOL_CONFIG: School = {
  id: "school-001",
  name: "SMK Negeri 1 Contoh Kota",
  address: "Jl. Pendidikan No. 1, Kota Contoh, Jawa Timur",
  latitude: -7.2575,
  longitude: 112.7521,
  radius: 9999999, // 9999 meters for testing
  checkInStart: "06:30",
  checkInEnd: "08:00",
  checkOutStart: "14:00",
  checkOutEnd: "17:00",
};

// Password: "password123" → in real app this would be bcrypt hashed
const HASHED_PASSWORD = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VkDg9zLHW";

export const DUMMY_ADMINS: Admin[] = [
  {
    id: "admin-001",
    name: "Budi Santoso",
    username: "admin",
    password: HASHED_PASSWORD,
    role: "admin",
    phone: "081234567890",
    createdAt: "2024-01-01T00:00:00.000Z",
    isActive: true,
  },
];

export const DUMMY_TEACHERS: Teacher[] = [
  {
    id: "guru-001",
    name: "Siti Rahayu, S.Pd",
    username: "guru1",
    password: HASHED_PASSWORD,
    role: "guru",
    nip: "198501012010012001",
    mataPelajaran: ["Matematika", "Fisika"],
    kelasWali: "XII IPA 1",
    phone: "082345678901",
    createdAt: "2024-01-02T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "guru-002",
    name: "Ahmad Fauzi, S.Kom",
    username: "guru2",
    password: HASHED_PASSWORD,
    role: "guru",
    nip: "198701012010011002",
    mataPelajaran: ["Pemrograman Web", "Basis Data"],
    kelasWali: "XI TSM 1",
    phone: "083456789012",
    createdAt: "2024-01-03T00:00:00.000Z",
    isActive: true,
  },
  ...(ADDITIONAL_TEACHERS as Teacher[])
];

export const DUMMY_STUDENTS: Student[] = [
  {
    id: "siswa-001",
    name: "Rizky Pratama",
    username: "rizky.pratama",
    password: HASHED_PASSWORD,
    role: "siswa",
    nisn: "0051234001",
    kelas: "XII DKV 1",
    jurusan: "DKV",
    phone: "085678901234",
    parentId: "wali-001",
    createdAt: "2024-07-15T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "siswa-002",
    name: "Dewi Anggraini",
    username: "dewi.anggraini",
    password: HASHED_PASSWORD,
    role: "siswa",
    nisn: "0051234002",
    kelas: "XII DKV 1",
    jurusan: "DKV",
    phone: "086789012345",
    parentId: "wali-002",
    createdAt: "2024-07-15T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "siswa-003",
    name: "Muhammad Fajar",
    username: "m.fajar",
    password: HASHED_PASSWORD,
    role: "siswa",
    nisn: "0051234003",
    kelas: "XI TSM 1",
    jurusan: "TSM",
    phone: "087890123456",
    parentId: "wali-003",
    createdAt: "2024-07-16T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "siswa-004",
    name: "Putri Ramadhani",
    username: "putri.ramadhani",
    password: HASHED_PASSWORD,
    role: "siswa",
    nisn: "0051234004",
    kelas: "XI TSM 1",
    jurusan: "TSM",
    phone: "088901234567",
    parentId: "wali-004",
    createdAt: "2024-07-16T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "siswa-005",
    name: "Andi Nugroho",
    username: "andi.nugroho",
    password: HASHED_PASSWORD,
    role: "siswa",
    nisn: "0051234005",
    kelas: "XII DKV 1",
    jurusan: "DKV",
    phone: "089012345678",
    parentId: "wali-005",
    createdAt: "2024-07-17T00:00:00.000Z",
    isActive: true,
  },
];

export const DUMMY_PARENTS: Parent[] = [
  {
    id: "wali-001",
    name: "Bapak Pratama",
    username: "pratama.ayah",
    password: HASHED_PASSWORD,
    role: "wali",
    studentIds: ["siswa-001"],
    waNumber: "628112345001",
    phone: "081123450001",
    createdAt: "2024-07-15T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "wali-002",
    name: "Ibu Anggraini",
    username: "anggraini.ibu",
    password: HASHED_PASSWORD,
    role: "wali",
    studentIds: ["siswa-002"],
    waNumber: "628112345002",
    phone: "081123450002",
    createdAt: "2024-07-15T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "wali-003",
    name: "Bapak Fajar",
    username: "fajar.bapak",
    password: HASHED_PASSWORD,
    role: "wali",
    studentIds: ["siswa-003"],
    waNumber: "628112345003",
    phone: "081123450003",
    createdAt: "2024-07-16T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "wali-004",
    name: "Ibu Ramadhani",
    username: "ramadhani.ibu",
    password: HASHED_PASSWORD,
    role: "wali",
    studentIds: ["siswa-004"],
    waNumber: "628112345004",
    phone: "081123450004",
    createdAt: "2024-07-16T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "wali-005",
    name: "Bapak Nugroho",
    username: "nugroho.ayah",
    password: HASHED_PASSWORD,
    role: "wali",
    studentIds: ["siswa-005"],
    waNumber: "628112345005",
    phone: "081123450005",
    createdAt: "2024-07-17T00:00:00.000Z",
    isActive: true,
  },
];

export const DUMMY_CLASSES: ClassData[] = [
  {
    id: "kelas-001",
    name: "XII DKV 1",
    jurusan: "DKV",
    teacherId: "guru-001",
    studentIds: ["siswa-001", "siswa-002", "siswa-005"],
  },
  {
    id: "kelas-002",
    name: "XI TSM 1",
    jurusan: "TSM",
    teacherId: "guru-002",
    studentIds: ["siswa-003", "siswa-004"],
  },
];

// Generate dummy attendance records for the past 30 days
// Fungsi untuk mem-generate data simulasi riwayat absensi siswa selama 30 hari terakhir (berguna untuk testing grafik dashboard)
function generateDummyAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const statuses: Array<{ status: "hadir" | "terlambat" | "tidak_hadir" }> = [
    { status: "hadir" }, { status: "hadir" }, { status: "hadir" },
    { status: "hadir" }, { status: "terlambat" }, { status: "tidak_hadir" },
  ];

  DUMMY_STUDENTS.forEach((student) => {
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const statusObj = statuses[Math.floor(Math.random() * statuses.length)];
      const dateStr = date.toISOString().split("T")[0];

      const record: AttendanceRecord = {
        id: `att-${student.id}-${dateStr}`,
        studentId: student.id,
        studentName: student.name,
        kelas: student.kelas,
        date: dateStr,
        status: statusObj.status,
      };

      if (statusObj.status === "hadir" || statusObj.status === "terlambat") {
        const checkInHour = statusObj.status === "hadir" ? 7 : 8;
        const checkInMin = Math.floor(Math.random() * 30);
        record.checkIn = {
          time: `${String(checkInHour).padStart(2, "0")}:${String(checkInMin).padStart(2, "0")}`,
          latitude: SCHOOL_CONFIG.latitude + (Math.random() - 0.5) * 0.0005,
          longitude: SCHOOL_CONFIG.longitude + (Math.random() - 0.5) * 0.0005,
          faceVerified: true,
          locationVerified: true,
        };
        record.checkOut = {
          time: `15:${String(Math.floor(Math.random() * 30)).padStart(2, "0")}`,
          latitude: SCHOOL_CONFIG.latitude + (Math.random() - 0.5) * 0.0005,
          longitude: SCHOOL_CONFIG.longitude + (Math.random() - 0.5) * 0.0005,
        };
      }

      records.push(record);
    }
  });

  return records;
}

export const DUMMY_ATTENDANCE: AttendanceRecord[] = generateDummyAttendance();

export const DUMMY_NOTIFICATION_LOGS: NotificationLog[] = [
  {
    id: "notif-001",
    studentId: "siswa-003",
    parentId: "wali-003",
    type: "push",
    message: "Anak Anda, Muhammad Fajar, tidak melakukan absensi hari ini (Senin, 28 Apr 2025). Mohon konfirmasi.",
    sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "sent",
    attendanceId: "att-siswa-003-2025-04-28",
  },
  {
    id: "notif-002",
    studentId: "siswa-003",
    parentId: "wali-003",
    type: "whatsapp",
    message: "Anak Anda, Muhammad Fajar, tidak melakukan absensi hari ini (Senin, 28 Apr 2025). Mohon konfirmasi.",
    sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "sent",
    attendanceId: "att-siswa-003-2025-04-28",
  },
  {
    id: "notif-003",
    studentId: "siswa-001",
    parentId: "wali-001",
    type: "email",
    message: "Anak Anda, Rizky Pratama, terlambat masuk sekolah hari ini. Jam check-in: 08:15.",
    sentAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: "sent",
    attendanceId: "att-siswa-001-today",
  },
];

// ── NEW: Dummy Permits ─────────────────────────────────────
export const DUMMY_PERMITS: PermitRequest[] = [
  {
    id: "izin-001",
    studentId: "siswa-003",
    studentName: "Muhammad Fajar",
    kelas: "XI TSM 1",
    type: "sakit",
    startDate: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
    endDate: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    reason: "Demam dan flu, sudah periksa ke dokter",
    status: "approved",
    approvedBy: "guru-002",
    approvedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "izin-002",
    studentId: "siswa-001",
    studentName: "Rizky Pratama",
    kelas: "XII DKV 1",
    type: "dispensasi",
    startDate: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0],
    endDate: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0],
    reason: "Lomba Olimpiade Matematika tingkat kota",
    status: "approved",
    approvedBy: "guru-001",
    approvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "izin-003",
    studentId: "siswa-004",
    studentName: "Putri Ramadhani",
    kelas: "XI TSM 1",
    type: "izin",
    startDate: new Date(Date.now() + 86400000 * 1).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 1).toISOString().split("T")[0],
    reason: "Ada urusan keluarga yang tidak dapat ditunda",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "izin-004",
    studentId: "siswa-002",
    studentName: "Dewi Anggraini",
    kelas: "XII DKV 1",
    type: "sakit",
    startDate: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    endDate: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    reason: "Sakit maag kambuh",
    status: "rejected",
    approvedBy: "guru-001",
    approvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    rejectedReason: "Harap lampirkan surat keterangan dokter",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

// ── NEW: Dummy Announcements ───────────────────────────────
export const DUMMY_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "pengumuman-001",
    title: "Jadwal Ujian Akhir Semester Genap 2024/2025",
    content: "Ujian Akhir Semester (UAS) Genap akan dilaksanakan mulai tanggal 2–13 Juni 2025. Seluruh siswa diwajibkan hadir tepat waktu. Keterlambatan lebih dari 15 menit tidak diperkenankan masuk ruang ujian.",
    targetRoles: ["siswa", "guru", "wali"],
    priority: "penting",
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    authorId: "admin-001",
    authorName: "Budi Santoso",
  },
  {
    id: "pengumuman-002",
    title: "Libur Nasional — Hari Kebangkitan Nasional",
    content: "Diberitahukan bahwa pada tanggal 20 Mei 2025, sekolah diliburkan dalam rangka memperingati Hari Kebangkitan Nasional. Kegiatan belajar mengajar akan kembali normal pada hari Selasa, 21 Mei 2025.",
    targetRoles: ["siswa", "guru", "wali", "admin"],
    priority: "normal",
    publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    authorId: "admin-001",
    authorName: "Budi Santoso",
  },
  {
    id: "pengumuman-003",
    title: "⚠️ Peringatan: Tingkat Kehadiran Di Bawah Standar",
    content: "Berdasarkan rekap absensi bulan April 2025, terdapat beberapa siswa dengan tingkat kehadiran di bawah 75%. Siswa yang bersangkutan akan dipanggil bersama orang tua/wali untuk klarifikasi.",
    targetRoles: ["guru", "admin"],
    priority: "darurat",
    publishedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    authorId: "admin-001",
    authorName: "Budi Santoso",
  },
  {
    id: "pengumuman-004",
    title: "Agenda Rapat Orang Tua/Wali — Semester Baru",
    content: "Akan diadakan rapat orang tua/wali murid pada Sabtu, 24 Mei 2025 pukul 08.00–12.00 WIB di Aula Sekolah. Kehadiran orang tua/wali sangat diharapkan.",
    targetRoles: ["wali"],
    priority: "penting",
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    authorId: "admin-001",
    authorName: "Budi Santoso",
  },
];

// ── NEW: Dummy Academic Events ─────────────────────────────
export const DUMMY_EVENTS: AcademicEvent[] = [
  {
    id: "event-001",
    title: "Ujian Akhir Semester Genap",
    startDate: new Date(Date.now() + 86400000 * 10).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 21).toISOString().split("T")[0],
    type: "ujian",
    description: "UAS Genap TA 2024/2025",
    createdBy: "admin-001",
  },
  {
    id: "event-002",
    title: "Hari Kebangkitan Nasional",
    startDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    type: "libur_nasional",
    description: "Libur Nasional",
    createdBy: "admin-001",
  },
  {
    id: "event-003",
    title: "Penerimaan Rapor Semester",
    startDate: new Date(Date.now() + 86400000 * 25).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 25).toISOString().split("T")[0],
    type: "kegiatan",
    description: "Pengambilan rapor oleh orang tua/wali murid",
    createdBy: "admin-001",
  },
  {
    id: "event-004",
    title: "Rapat Dewan Guru",
    startDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    type: "rapat",
    description: "Rapat evaluasi semester dan persiapan UAS",
    createdBy: "admin-001",
  },
  {
    id: "event-005",
    title: "Lomba Olah Raga Antar Kelas",
    startDate: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    endDate: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0],
    type: "kegiatan",
    description: "O2SN antar kelas tingkat sekolah",
    createdBy: "admin-001",
  },
];

// ── NEW: Dummy Audit Logs ──────────────────────────────────
export const DUMMY_AUDIT_LOGS: AuditLog[] = [
  {
    id: "audit-001",
    userId: "admin-001",
    userName: "Budi Santoso",
    role: "admin",
    action: "LOGIN",
    target: "Budi Santoso",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "audit-002",
    userId: "admin-001",
    userName: "Budi Santoso",
    role: "admin",
    action: "TAMBAH_SISWA",
    target: "Rizky Pratama",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "audit-003",
    userId: "guru-001",
    userName: "Siti Rahayu, S.Pd",
    role: "guru",
    action: "APPROVE_IZIN",
    target: "izin-002",
    detail: "Dispensasi Olimpiade - Rizky Pratama",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "audit-004",
    userId: "admin-001",
    userName: "Budi Santoso",
    role: "admin",
    action: "KIRIM_NOTIFIKASI",
    target: "Muhammad Fajar",
    detail: "Notifikasi ketidakhadiran ke wali",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "audit-005",
    userId: "siswa-003",
    userName: "Muhammad Fajar",
    role: "siswa",
    action: "ABSENSI_MASUK",
    target: "XI TSM 1",
    detail: "Check-in 07:45, GPS & Face verified",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

// All users combined for auth lookup
// Menggabungkan seluruh entitas pengguna ke dalam satu array untuk memudahkan pengecekan saat proses Autentikasi (Login)
export const ALL_USERS: User[] = [
  ...DUMMY_ADMINS,
  ...DUMMY_TEACHERS,
  ...DUMMY_STUDENTS,
  ...DUMMY_PARENTS,
];

export const DUMMY_SCHEDULES: ClassSchedule[] = _DUMMY_SCHEDULES as ClassSchedule[];
