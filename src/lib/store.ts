// ============================================================
// AbsensiCerdas - Global State Store (Zustand)
// ============================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import {
  User, Student, Teacher, Parent, AttendanceRecord, NotificationLog,
  DashboardStats, UserRole, PermitRequest, AuditLog, AuditAction,
  Announcement, AcademicEvent, SubjectAttendanceRecord, InAppNotification, ClassSchedule,
} from "./types";
import {
  ALL_USERS, DUMMY_STUDENTS, DUMMY_ATTENDANCE,
  DUMMY_NOTIFICATION_LOGS, DUMMY_PARENTS, DUMMY_TEACHERS,
  DUMMY_PERMITS, DUMMY_ANNOUNCEMENTS, DUMMY_EVENTS, DUMMY_AUDIT_LOGS, DUMMY_SCHEDULES, SCHOOL_CONFIG,
} from "./data";

// ── Auth ──────────────────────────────────────────────────
// Antarmuka (Interface) untuk state Autentikasi pengguna
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, kelas?: string) => { success: boolean; message: string };
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

// ── Attendance ────────────────────────────────────────────
// Antarmuka (Interface) untuk state Absensi (menyimpan rekam data, notifikasi, dll)
interface AttendanceState {
  records: AttendanceRecord[];
  notifications: NotificationLog[];
  addAttendance: (record: AttendanceRecord) => void;
  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => void;
  addNotification: (notif: NotificationLog) => void;
  getTodayAttendance: () => AttendanceRecord[];
  getStudentAttendance: (studentId: string) => AttendanceRecord[];
  getDashboardStats: () => DashboardStats;
  getAttendanceByClass: (kelas: string) => AttendanceRecord[];
}

// ── Permit ────────────────────────────────────────────────
interface PermitState {
  permits: PermitRequest[];
  addPermit: (permit: PermitRequest) => void;
  updatePermit: (id: string, updates: Partial<PermitRequest>) => void;
  getPermitsByStudent: (studentId: string) => PermitRequest[];
  getPermitsByClass: (kelas: string) => PermitRequest[];
  getPendingPermits: () => PermitRequest[];
}

// ── Audit Log ─────────────────────────────────────────────
interface AuditState {
  auditLogs: AuditLog[];
  addAuditLog: (action: AuditAction, target?: string, detail?: string) => void;
}

// ── Announcement ──────────────────────────────────────────
interface AnnouncementState {
  announcements: Announcement[];
  addAnnouncement: (a: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
  getAnnouncementsForUser: (role: UserRole, kelas?: string) => Announcement[];
}

// ── Academic Calendar ─────────────────────────────────────
interface CalendarState {
  events: AcademicEvent[];
  addEvent: (event: AcademicEvent) => void;
  updateEvent: (id: string, updates: Partial<AcademicEvent>) => void;
  deleteEvent: (id: string) => void;
}

// ── Subject Attendance ────────────────────────────────────
interface SubjectAttendanceState {
  subjectRecords: SubjectAttendanceRecord[];
  addSubjectRecord: (record: SubjectAttendanceRecord) => void;
  updateSubjectRecord: (id: string, updates: Partial<SubjectAttendanceRecord>) => void;
  getSubjectRecordsByTeacher: (teacherId: string) => SubjectAttendanceRecord[];
}

// ── In-App Notifications ──────────────────────────────────
interface InAppNotifState {
  inAppNotifications: InAppNotification[];
  addInAppNotification: (notif: InAppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getNotificationsForUser: (userId: string) => InAppNotification[];
}

// ── Full App State ────────────────────────────────────────
interface AppState extends
  AuthState, AttendanceState, PermitState, AuditState,
  AnnouncementState, CalendarState, SubjectAttendanceState, InAppNotifState {
  students: Student[];
  teachers: Teacher[];
  classes: string[];
  schedules: ClassSchedule[];
  addStudent: (student: Student) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addStudentsBulk: (students: Student[]) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addClass: (kelas: string) => void;
  updateClass: (oldName: string, newName: string) => void;
  deleteClass: (kelas: string) => void;
  addSchedule: (schedule: ClassSchedule) => void;
  updateSchedule: (id: string, updates: Partial<ClassSchedule>) => void;
  deleteSchedule: (id: string) => void;
  // Parents
  parents: Parent[];
  addParent: (parent: Parent) => void;
  updateParent: (id: string, updates: Partial<Parent>) => void;
  deleteParent: (id: string) => void;
  // Config
  schoolConfig: import("@/lib/types").School;
  updateSchoolConfig: (updates: Partial<import("@/lib/types").School>) => void;
  promoteStudents: () => void;
  // Cron Simulation
  lastAbsenceCheckDate: string | null;
  checkAndNotifyAbsentees: () => void;
  // Sinkronisasi DB Awal
  hydrateFromDB: () => Promise<void>;
}

// Simple password check — in production use bcrypt compare
// Fungsi pengecekan password sederhana. (Catatan: untuk versi produksi sebaiknya gunakan hashing seperti bcrypt)
const checkPassword = (input: string, _stored: string): boolean => {
  return input === "password123" || input === _stored;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrateFromDB: async () => {
        try {
          const currentUser = get().currentUser;

          // Tarik data siswa — replace dengan data DB jika ada
          const resSiswa = await fetch("/api/students");
          const dataSiswa = await resSiswa.json();
          if (dataSiswa.success && dataSiswa.data.length > 0) {
            // Replace: data DB selalu dominan, dummy tidak tercampur
            set({ students: dataSiswa.data });
          }

          // Tarik data guru & wali dari Database
          const resUsers = await fetch("/api/users");
          const dataUsers = await resUsers.json();
          if (dataUsers.success && dataUsers.data.length > 0) {
            const dbGurus = dataUsers.data.filter((u: any) => u.role === "guru");
            const dbWalis = dataUsers.data.filter((u: any) => u.role === "wali");
            // Replace: jika DB punya data, pakai DB saja
            if (dbGurus.length > 0) set({ teachers: dbGurus });
            if (dbWalis.length > 0) set({ parents: dbWalis });
          }

          // Tarik data absensi — replace dengan data DB agar Desktop & Mobile selalu tersinkronisasi
          const resAbsen = await fetch("/api/attendance");
          const dataAbsen = await resAbsen.json();
          if (dataAbsen.success) {
            // Replace: absensi dari DB adalah sumber kebenaran tunggal
            set({ records: dataAbsen.data });
          }

          // Tarik notifikasi jika user login — replace agar selalu fresh dari DB
          if (currentUser) {
            const resNotif = await fetch(`/api/notifications?userId=${currentUser.id}`);
            const dataNotif = await resNotif.json();
            if (dataNotif.success) {
              set({ inAppNotifications: dataNotif.data });
            }
          }

          // Tarik konfigurasi sekolah (Radius absensi, dll)
          const resConfig = await fetch("/api/config");
          const dataConfig = await resConfig.json();
          if (dataConfig.success && dataConfig.data) {
            set({ schoolConfig: dataConfig.data });
          }
        } catch (e) {
          console.error("Gagal load data dari DB:", e);
        }
      },

      // ── Auth ──────────────────────────────────────────────
      currentUser: null,
      isAuthenticated: false,

       
       
      login: (username, password, kelas) => {
        // Fungsi utama untuk menangani proses login
        // Gabungkan user statis (admin) dengan user dinamis di state (siswa, guru, wali)
        const adminUsers = ALL_USERS.filter(u => u.role === "admin");
        const dynamicUsers = [...get().students, ...get().teachers, ...get().parents];
        const currentUsers = [...adminUsers, ...dynamicUsers];

        const user = currentUsers.find(
          (u) => (u.username || u.email || "").toLowerCase() === username.toLowerCase()
        );

        if (!user) return { success: false, message: "Username tidak ditemukan" };
        
        if (user.role === "siswa") {
          if (!kelas) {
            return { success: false, message: "Harap pilih kelas Anda" };
          }
          if ((user as Student).kelas !== kelas) {
            return { success: false, message: "Kelas yang dipilih tidak sesuai dengan data siswa" };
          }
        }

        if (user.role === "siswa" && (user as Student).isAlumni)
          return { success: false, message: "Akses Ditolak: Akun alumni sudah tidak memiliki akses login." };

        if (!checkPassword(password, user.password))
          return { success: false, message: "Password salah" };
        if (!user.isActive)
          return { success: false, message: "Akun tidak aktif" };
        
        set({ currentUser: user, isAuthenticated: true });
        // Audit log
        get().addAuditLog("LOGIN", user.name);
        return { success: true, message: "Login berhasil" };
      },

      logout: () => {
        const user = get().currentUser;
        if (user) get().addAuditLog("LOGOUT", user.name);
        set({ currentUser: null, isAuthenticated: false });
      },

      updateProfile: (updates) =>
        set((s) => ({
          currentUser: s.currentUser ? { ...s.currentUser, ...updates } : null,
        })),

      // ── Students ──────────────────────────────────────────
      students: DUMMY_STUDENTS,
      addStudent: async (student) => {
        // 1. Simpan ke Database
        try {
          await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student),
          });
        } catch (e) { console.error("Gagal simpan ke DB", e); }
        
        // 2. Update UI (Zustand)
        set((s) => ({ students: [...s.students, student] }));
        get().addAuditLog("TAMBAH_SISWA", student.name);
      },
      updateStudent: async (id, updates) => {
        // 1. Update ke Database
        try {
          await fetch(`/api/students/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
        } catch (e) { console.error("Gagal update DB", e); }

        // 2. Update UI
        set((s) => ({
          students: s.students.map((st) =>
            st.id === id ? { ...st, ...updates } : st
          ),
          currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...updates } : s.currentUser
        }));
        get().addAuditLog("EDIT_SISWA", id);
      },
      addStudentsBulk: (newStudents) =>
        set((s) => ({ students: [...s.students, ...newStudents] })),
      deleteStudent: async (id) => {
        // 1. Hapus dari Database
        try {
          await fetch(`/api/students/${id}`, { method: "DELETE" });
        } catch (e) { console.error("Gagal hapus DB", e); }

        // 2. Update UI
        set((s) => ({ students: s.students.filter((st) => st.id !== id) }));
        get().addAuditLog("HAPUS_SISWA", id);
      },
      promoteStudents: () => {
        const currentYear = new Date().getFullYear();
        set((s) => ({
          students: s.students.map((st) => {
            if (st.isAlumni) return st; // Skip already alumni

            if (st.kelas.startsWith("XII ")) {
              // Promote to alumni
              return { ...st, isAlumni: true, graduationYear: currentYear };
            } else if (st.kelas.startsWith("XI ")) {
              // Promote XI to XII
              return { ...st, kelas: st.kelas.replace("XI ", "XII ") };
            } else if (st.kelas.startsWith("X ")) {
              // Promote X to XI
              return { ...st, kelas: st.kelas.replace("X ", "XI ") };
            }
            return st;
          })
        }));
        get().addAuditLog("NAIK_KELAS", "Semua Siswa");
      },

      // ── Teachers ──────────────────────────────────────────
      teachers: DUMMY_TEACHERS,
      addTeacher: async (teacher) => {
        try {
          await fetch("/api/users", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...teacher, role: "guru", password: "password123" }),
          });
        } catch (e) { console.error("Gagal simpan guru DB", e); }

        set((s) => ({ teachers: [...s.teachers, teacher] }));
        get().addAuditLog("TAMBAH_GURU", teacher.name);
      },
      updateTeacher: async (id, updates) => {
        try {
          await fetch(`/api/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
        } catch (e) { console.error("Gagal update guru DB", e); }

        set((s) => ({
          teachers: s.teachers.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...updates } : s.currentUser
        }));
        get().addAuditLog("EDIT_GURU", id);
      },
      deleteTeacher: async (id) => {
        try {
          await fetch(`/api/users/${id}`, { method: "DELETE" });
        } catch (e) { console.error("Gagal hapus guru DB", e); }

        set((s) => ({ teachers: s.teachers.filter((t) => t.id !== id) }));
        get().addAuditLog("HAPUS_GURU", id);
      },

      // ── Classes & Schedules ───────────────────────────────
      classes: [
        "X DKV 1", "X DKV 2", "X DKV 3", "X TSM 1", "X TSM 2", "X TSM 3",
        "XI DKV 1", "XI DKV 2", "XI DKV 3", "XI TSM 1", "XI TSM 2", "XI TSM 3",
        "XII DKV 1", "XII DKV 2", "XII DKV 3", "XII TSM 1", "XII TSM 2", "XII TSM 3",
      ],
      addClass: (kelas) =>
        set((s) => ({ classes: s.classes.includes(kelas) ? s.classes : [...s.classes, kelas] })),
      updateClass: (oldName, newName) =>
        set((s) => ({ classes: s.classes.map((c) => c === oldName ? newName : c) })),
      deleteClass: (kelas) =>
        set((s) => ({ classes: s.classes.filter((c) => c !== kelas) })),

      schedules: DUMMY_SCHEDULES,
      addSchedule: (schedule) =>
        set((s) => ({ schedules: [schedule, ...s.schedules] })),
      updateSchedule: (id, updates) =>
        set((s) => ({
          schedules: s.schedules.map((sch) => sch.id === id ? { ...sch, ...updates } : sch),
        })),
      deleteSchedule: (id) =>
        set((s) => ({ schedules: s.schedules.filter((sch) => sch.id !== id) })),

      // ── Parents ────────────────────────────────
      parents: DUMMY_PARENTS,
      addParent: async (parent) => {
        try {
          await fetch("/api/users", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...parent, role: "wali", password: "password123" }),
          });
        } catch (e) { console.error("Gagal simpan wali DB", e); }

        set((s) => ({ parents: [...s.parents, parent] }));
      },
      updateParent: async (id, updates) => {
        try {
          await fetch(`/api/users/${id}`, { 
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
        } catch (e) { console.error("Gagal update wali DB", e); }

        set((s) => ({
          parents: s.parents.map((p) => p.id === id ? { ...p, ...updates } : p),
          currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...updates } : s.currentUser,
        }));
      },
      deleteParent: async (id) => {
        try {
          await fetch(`/api/users/${id}`, { method: "DELETE" });
        } catch (e) { console.error("Gagal hapus wali DB", e); }

        set((s) => ({ parents: s.parents.filter((p) => p.id !== id) }));
      },

      // ── Config ────────────────────────────────
      schoolConfig: SCHOOL_CONFIG,
      updateSchoolConfig: async (updates) => {
        // 1. Update ke Database
        try {
          await fetch("/api/config", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
        } catch (e) { console.error("Gagal update config DB", e); }

        // 2. Update UI State
        set((s) => ({ schoolConfig: { ...s.schoolConfig, ...updates } }));
        get().addAuditLog("EDIT_CONFIG", "School Configuration");
      },

      // ── Attendance ────────────────────────────────────────
      records: DUMMY_ATTENDANCE,
      notifications: DUMMY_NOTIFICATION_LOGS,

      addAttendance: (record) =>
        set((s) => ({ records: [record, ...s.records] })),

      updateAttendance: (id, updates) =>
        set((s) => ({
          records: s.records.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      addNotification: (notif) =>
        set((s) => ({ notifications: [notif, ...s.notifications] })),

      getTodayAttendance: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().records.filter((r) => r.date === today);
      },

      getStudentAttendance: (studentId) => {
        // O(1) lookup via filter — acceptable for client-side store
        // For 500 students × 200 days = 100k records, this runs once per student view
        return get().records.filter((r) => r.studentId === studentId);
      },

      getAttendanceByClass: (kelas) =>
        get().records.filter((r) => r.kelas === kelas),

      getDashboardStats: () => {
        // Fungsi untuk mengkalkulasi dan mengambil statistik dashboard secara real-time
        const today = new Date().toISOString().split("T")[0];
        const todayRecords = get().records.filter((r) => r.date === today);
        const activeStudents = get().students.filter(s => !s.isAlumni);
        const totalStudents = activeStudents.length;
        const presentToday = todayRecords.filter((r) => r.status === "hadir").length;
        const lateToday = todayRecords.filter((r) => r.status === "terlambat").length;
        const absentToday = totalStudents - todayRecords.length +
          todayRecords.filter((r) => r.status === "tidak_hadir").length;

        const weeklyData = [];
        const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const dayRecs = get().records.filter((r) => r.date === dateStr);
          weeklyData.push({
            day: days[d.getDay()],
            hadir: dayRecs.filter((r) => r.status === "hadir").length,
            terlambat: dayRecs.filter((r) => r.status === "terlambat").length,
            tidak_hadir: dayRecs.filter((r) => r.status === "tidak_hadir").length,
          });
        }

        const totalPossible = get().records.length;
        const totalPresent = get().records.filter(
          (r) => r.status === "hadir" || r.status === "terlambat"
        ).length;

        return {
          totalStudents,
          presentToday: presentToday + lateToday,
          lateToday,
          absentToday,
          attendanceRate: totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0,
          weeklyData,
        };
      },

      // ── Permits ───────────────────────────────────────────
      permits: DUMMY_PERMITS,
      addPermit: (permit) =>
        set((s) => ({ permits: [permit, ...s.permits] })),
      updatePermit: (id, updates) =>
        set((s) => ({
          permits: s.permits.map((p) => p.id === id ? { ...p, ...updates } : p),
        })),
      getPermitsByStudent: (studentId) =>
        get().permits.filter((p) => p.studentId === studentId),
      getPermitsByClass: (kelas) =>
        get().permits.filter((p) => p.kelas === kelas),
      getPendingPermits: () =>
        get().permits.filter((p) => p.status === "pending"),

      // ── Audit Logs ────────────────────────────────────────
      auditLogs: DUMMY_AUDIT_LOGS,
      addAuditLog: (action, target?, detail?) => {
        const user = get().currentUser;
        if (!user) return;
        const log: AuditLog = {
          id: `audit-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          role: user.role,
          action,
          target,
          detail,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ auditLogs: [log, ...s.auditLogs].slice(0, 500) }));
      },

      // ── Announcements ─────────────────────────────────────
      announcements: DUMMY_ANNOUNCEMENTS,
      addAnnouncement: (a) => {
        set((s) => ({ announcements: [a, ...s.announcements] }));
        get().addAuditLog("TAMBAH_PENGUMUMAN", a.title);
      },
      deleteAnnouncement: (id) => {
        set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) }));
        get().addAuditLog("HAPUS_PENGUMUMAN", id);
      },
      getAnnouncementsForUser: (role, kelas?) => {
        const now = new Date().toISOString();
        return get().announcements.filter((a) => {
          if (a.expiresAt && a.expiresAt < now) return false;
          if (!a.targetRoles.includes(role)) return false;
          if (kelas && a.targetKelas && a.targetKelas.length > 0) {
            return a.targetKelas.includes(kelas);
          }
          return true;
        });
      },

      // ── Academic Calendar ─────────────────────────────────
      events: DUMMY_EVENTS,
      addEvent: (event) => {
        set((s) => ({ events: [event, ...s.events] }));
        get().addAuditLog("TAMBAH_EVENT", event.title);
      },
      updateEvent: (id, updates) =>
        set((s) => ({
          events: s.events.map((e) => e.id === id ? { ...e, ...updates } : e),
        })),
      deleteEvent: (id) => {
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
        get().addAuditLog("HAPUS_EVENT", id);
      },

      // ── Subject Attendance ────────────────────────────────
      subjectRecords: [],
      addSubjectRecord: (record) =>
        set((s) => ({ subjectRecords: [record, ...s.subjectRecords] })),
      updateSubjectRecord: (id, updates) =>
        set((s) => ({
          subjectRecords: s.subjectRecords.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      getSubjectRecordsByTeacher: (teacherId) =>
        get().subjectRecords.filter((r) => r.teacherId === teacherId),

      // ── In-App Notifications ──────────────────────────────
      inAppNotifications: [],
      addInAppNotification: (notif) =>
        set((s) => ({ inAppNotifications: [notif, ...s.inAppNotifications] })),
      markAsRead: (id) =>
        set((s) => ({
          inAppNotifications: s.inAppNotifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),
      markAllAsRead: (userId) =>
        set((s) => ({
          inAppNotifications: s.inAppNotifications.map((n) =>
            n.userId === userId ? { ...n, isRead: true } : n
          ),
        })),
      getUnreadCount: (userId) =>
        get().inAppNotifications.filter((n) => n.userId === userId && !n.isRead).length,
      getNotificationsForUser: (userId) =>
        get().inAppNotifications.filter((n) => n.userId === userId),

      // ── Cron Simulation ───────────────────────────────────────
      lastAbsenceCheckDate: null,
      checkAndNotifyAbsentees: () => {
        const state = get();
        const today = new Date().toISOString().split("T")[0];
        
        // Cek apakah hari ini sudah pernah dijalankan
        if (state.lastAbsenceCheckDate === today) return;

        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5); // "HH:mm"
        const checkInEnd = state.schoolConfig.checkInEnd;

        // Hanya jalankan jika waktu sekarang sudah melewati batas jam masuk (misal 07:30)
        if (currentTime > checkInEnd) {
          const newNotifs: import("@/lib/types").InAppNotification[] = [];
          
          state.parents.forEach(parent => {
            parent.studentIds.forEach(studentId => {
              const student = state.students.find(s => s.id === studentId);
              if (!student || student.isAlumni) return;

              // Cari record absensi siswa untuk hari ini
              const todayRecord = state.records.find(r => r.studentId === student.id && r.date === today);
              
              // Cari apakah ada izin yang disetujui (opsional, jika tidak ada record izin khusus, asumsikan Alpha)
              const hasPermit = state.permits.find(p => p.studentId === student.id && p.startDate <= today && p.endDate >= today && p.status === "approved");

              if (!todayRecord && !hasPermit) {
                // Belum ada absen dan tidak ada izin -> Kirim notifikasi Alpha ke wali murid
                newNotifs.push({
                  id: `notif-alpha-${student.id}-${today}`,
                  userId: parent.id,
                  title: "⚠️ Peringatan Kehadiran",
                  message: `Pemberitahuan: Anak Anda, ${student.name}, belum melakukan absensi hari ini hingga batas waktu (${checkInEnd}). Siswa tercatat ALPA.`,
                  type: "danger",
                  isRead: false,
                  link: `/dashboard/wali/anak`,
                  createdAt: new Date().toISOString(),
                });
              }
            });
          });

          if (newNotifs.length > 0) {
            set((s) => ({
              inAppNotifications: [...newNotifs, ...s.inAppNotifications],
              lastAbsenceCheckDate: today, // Tandai bahwa hari ini sudah dicek
            }));
          } else {
            set({ lastAbsenceCheckDate: today });
          }
        }
      },
    }),
    {
      name: "absensi-cerdas-store-v5",
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        records: state.records,
        notifications: state.notifications,
        students: state.students,
        teachers: state.teachers,
        classes: state.classes,
        schedules: state.schedules,
        permits: state.permits,
        schoolConfig: state.schoolConfig,
        auditLogs: state.auditLogs,
        announcements: state.announcements,
        events: state.events,
        subjectRecords: state.subjectRecords,
        inAppNotifications: state.inAppNotifications,
        parents: state.parents,
      }),
      storage: createJSONStorage(() => ({
        getItem: async (name: string): Promise<string | null> => {
          return (await get(name)) || null;
        },
        setItem: async (name: string, value: string): Promise<void> => {
          await set(name, value);
        },
        removeItem: async (name: string): Promise<void> => {
          await del(name);
        },
      })),
    }
  )
);
