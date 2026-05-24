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

// Pengecekan password untuk fallback store (hanya berlaku untuk dummy data plaintext)
// Password bcrypt dari DB TIDAK akan masuk ke sini karena GET /api/users sudah men-strip password
const checkPassword = (input: string, stored: string | undefined): boolean => {
  const trimmed = input.trim();
  // Jika tidak ada password tersimpan (user dari DB tanpa password di state), tolak
  if (!stored) return false;
  // Jika bcrypt hash masuk ke sini (fallback darurat), tolak — jangan bandingkan hash
  if (stored.startsWith("$2")) return false;
  return trimmed === "password123" || trimmed === stored;
};

// Lock untuk mencegah concurrent hydrateFromDB (race condition setiap 5 detik)
let isHydrating = false;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrateFromDB: async () => {
        if (isHydrating) return; // Skip jika masih dalam proses
        isHydrating = true;
        try {
          const currentUser = get().currentUser;

          // Jalankan semua fetch secara PARALEL untuk efisiensi maksimal
          const [resSiswa, resUsers, resAbsen, resConfig, resPermits, resAnn, resEvents, resAudit, resClasses] =
            await Promise.all([
              fetch("/api/students"),
              fetch("/api/users"),
              fetch("/api/attendance"),
              fetch("/api/school-config"),
              fetch("/api/permits"),
              fetch("/api/announcements"),
              fetch("/api/events"),
              fetch("/api/audit-logs"),
              fetch("/api/classes"),
            ]);

          const [dataSiswa, dataUsers, dataAbsen, dataConfig, dataPermits, dataAnn, dataEvents, dataAudit, dataClasses] =
            await Promise.all([
              resSiswa.json(),
              resUsers.json(),
              resAbsen.json(),
              resConfig.json(),
              resPermits.json(),
              resAnn.json(),
              resEvents.json(),
              resAudit.json(),
              resClasses.json(),
            ]);

          // Tarik data siswa — DB selalu dominan
          if (dataSiswa.success && dataSiswa.data.length > 0) {
            set({ students: dataSiswa.data });
          }

          // Tarik data guru & wali
          if (dataUsers.success && dataUsers.data.length > 0) {
            const dbGurus = dataUsers.data.filter((u: any) => u.role === "guru");
            const dbWalis = dataUsers.data.filter((u: any) => u.role === "wali");
            if (dbGurus.length > 0) set({ teachers: dbGurus });
            if (dbWalis.length > 0) set({ parents: dbWalis });
          }

          // Tarik data absensi — sumber kebenaran tunggal
          if (dataAbsen.success) set({ records: dataAbsen.data });

          // Tarik konfigurasi sekolah
          if (dataConfig.success && dataConfig.data) set({ schoolConfig: dataConfig.data });

          // Tarik data izin
          if (dataPermits.success) set({ permits: dataPermits.data });

          // Tarik pengumuman
          if (dataAnn.success) set({ announcements: dataAnn.data });

          // Tarik event kalender
          if (dataEvents.success) set({ events: dataEvents.data });

          // Tarik audit logs
          if (dataAudit.success) set({ auditLogs: dataAudit.data });

          // Tarik classes — jika DB kosong, seed dari state lokal agar sinkron ke semua device
          if (dataClasses.success && dataClasses.data.length > 0) {
            set({ classes: dataClasses.data });
          } else if (dataClasses.success && dataClasses.data.length === 0) {
            // DB belum punya kelas — push semua kelas lokal ke DB
            const localClasses = get().classes;
            try {
              await Promise.all(localClasses.map((name: string) =>
                fetch("/api/classes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name }),
                }).catch(() => {})
              ));
            } catch (e) {}
          }

          // Tarik notifikasi per-user secara terpisah (butuh userId)
          if (currentUser) {
            try {
              const resNotif = await fetch(`/api/notifications?userId=${currentUser.id}`);
              const dataNotif = await resNotif.json();
              if (dataNotif.success) set({ inAppNotifications: dataNotif.data });
            } catch {}
          }

        } catch (e) {
          console.error("Gagal load data dari DB:", e);
        } finally {
          isHydrating = false; // Reset lock agar siklus berikutnya bisa berjalan
        }
      },

      // ── Auth ──────────────────────────────────────────────
      currentUser: null,
      isAuthenticated: false,

       
       
      login: (username, password, kelas) => {
        const cleanUsername = username.trim().toLowerCase();
        // Fungsi utama untuk menangani proses login
        // Gabungkan user statis (admin) dengan user dinamis di state (siswa, guru, wali)
        const adminUsers = ALL_USERS.filter(u => u.role === "admin");
        const dynamicUsers = [...get().students, ...get().teachers, ...get().parents];
        const currentUsers = [...adminUsers, ...dynamicUsers];

        const user = currentUsers.find(
          (u) => (u.username || u.email || "").toLowerCase() === cleanUsername
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
        // Hapus field password jika kosong agar tidak me-reset password yang sudah ada
        const payload = { ...updates };
        if (!payload.password || String(payload.password).trim() === "") {
          delete payload.password;
        }
        try {
          await fetch(`/api/students/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e) { console.error("Gagal update DB", e); }

        // 2. Update UI (jika password kosong, jangan timpa di state)
        const uiUpdates = { ...payload };
        delete uiUpdates.password; // password tidak disimpan di client state
        set((s) => ({
          students: s.students.map((st) =>
            st.id === id ? { ...st, ...uiUpdates } : st
          ),
          currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...uiUpdates } : s.currentUser
        }));
        get().addAuditLog("EDIT_SISWA", id);
      },
      addStudentsBulk: async (newStudents) => {
        try {
          await Promise.all(newStudents.map(student => 
            fetch("/api/students", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(student),
            })
          ));
        } catch (e) { console.error("Gagal simpan bulk siswa", e); }
        set((s) => ({ students: [...s.students, ...newStudents] }));
        get().addAuditLog("TAMBAH_SISWA", `Bulk ${newStudents.length} siswa`);
      },
      deleteStudent: async (id) => {
        // 1. Hapus dari Database
        try {
          await fetch(`/api/students/${id}`, { method: "DELETE" });
        } catch (e) { console.error("Gagal hapus DB", e); }

        // 2. Update UI
        set((s) => ({ students: s.students.filter((st) => st.id !== id) }));
        get().addAuditLog("HAPUS_SISWA", id);
      },
      promoteStudents: async () => {
        const currentYear = new Date().getFullYear();
        const updatedStudents: Student[] = [];

        set((s) => ({
          students: s.students.map((st) => {
            if (st.isAlumni) return st; // Skip already alumni
            let newSt = { ...st };

            if (st.kelas.startsWith("XII ")) {
              newSt = { ...st, isAlumni: true, graduationYear: currentYear };
            } else if (st.kelas.startsWith("XI ")) {
              newSt = { ...st, kelas: st.kelas.replace("XI ", "XII ") };
            } else if (st.kelas.startsWith("X ")) {
              newSt = { ...st, kelas: st.kelas.replace("X ", "XI ") };
            }
            
            if (newSt.kelas !== st.kelas || newSt.isAlumni !== st.isAlumni) {
              updatedStudents.push(newSt);
            }
            return newSt;
          })
        }));

        // Simpan ke DB secara paralel
        try {
          await Promise.all(updatedStudents.map(st =>
            fetch(`/api/students/${st.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(st),
            })
          ));
        } catch (e) { console.error("Gagal promote siswa di DB", e); }

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
        // Hapus field password jika kosong agar tidak me-reset password yang sudah ada
        const payload = { ...updates };
        if (!payload.password || String(payload.password).trim() === "") {
          delete payload.password;
        }
        try {
          await fetch(`/api/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e) { console.error("Gagal update guru DB", e); }

        const uiUpdates = { ...payload };
        delete uiUpdates.password;
        set((s) => ({
          teachers: s.teachers.map((t) =>
            t.id === id ? { ...t, ...uiUpdates } : t
          ),
          currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...uiUpdates } : s.currentUser
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
      addClass: async (kelas) => {
        try {
          await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: kelas }) });
        } catch (e) {}
        set((s) => ({ classes: s.classes.includes(kelas) ? s.classes : [...s.classes, kelas] }));
      },
      updateClass: async (oldName, newName) => {
        try {
          await fetch("/api/classes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oldName, newName }) });
        } catch (e) {}
        set((s) => ({ classes: s.classes.map((c) => c === oldName ? newName : c) }));
      },
      deleteClass: async (kelas) => {
        try {
          await fetch(`/api/classes?name=${encodeURIComponent(kelas)}`, { method: "DELETE" });
        } catch (e) {}
        set((s) => ({ classes: s.classes.filter((c) => c !== kelas) }));
      },

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
        // Hapus field password jika kosong agar tidak me-reset password yang sudah ada
        const payload = { ...updates };
        if (!payload.password || String(payload.password).trim() === "") {
          delete payload.password;
        }
        try {
          await fetch(`/api/users/${id}`, { 
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e) { console.error("Gagal update wali DB", e); }

        const uiUpdates = { ...payload };
        delete uiUpdates.password;
        set((s) => ({
          parents: s.parents.map((p) => p.id === id ? { ...p, ...uiUpdates } : p),
          currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...uiUpdates } : s.currentUser,
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
          await fetch("/api/school-config", {
            method: "PUT",
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
      addPermit: async (permit) => {
        try {
          await fetch("/api/permits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(permit),
          });
        } catch (e) { console.error("Gagal simpan izin DB", e); }
        set((s) => ({ permits: [permit, ...s.permits] }));
      },
      updatePermit: async (id, updates) => {
        try {
          // Status bisa "approve" atau "reject" 
          const action = updates.status === "approved" ? "approve" : "reject";
          await fetch("/api/permits", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, action, ...updates }),
          });
        } catch (e) { console.error("Gagal update izin DB", e); }
        set((s) => ({
          permits: s.permits.map((p) => p.id === id ? { ...p, ...updates } : p),
        }));
      },
      getPermitsByStudent: (studentId) =>
        get().permits.filter((p) => p.studentId === studentId),
      getPermitsByClass: (kelas) =>
        get().permits.filter((p) => p.kelas === kelas),
      getPendingPermits: () =>
        get().permits.filter((p) => p.status === "pending"),

      // ── Audit Logs ────────────────────────────────────────
      auditLogs: DUMMY_AUDIT_LOGS,
      addAuditLog: async (action, target?, detail?) => {
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

        try {
          // Fire and forget ke DB
          fetch("/api/audit-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(log),
          }).catch(() => {});
        } catch (e) {}

        set((s) => ({ auditLogs: [log, ...s.auditLogs].slice(0, 500) }));
      },

      // ── Announcements ─────────────────────────────────────
      announcements: DUMMY_ANNOUNCEMENTS,
      addAnnouncement: async (a) => {
        try {
          await fetch("/api/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(a),
          });
        } catch (e) { console.error("Gagal simpan pengumuman DB", e); }
        set((s) => ({ announcements: [a, ...s.announcements] }));
        get().addAuditLog("TAMBAH_PENGUMUMAN", a.title);
      },
      deleteAnnouncement: async (id) => {
        try {
          await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
        } catch (e) { console.error("Gagal hapus pengumuman DB", e); }
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
      addEvent: async (event) => {
        try {
          await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event),
          });
        } catch (e) { console.error("Gagal simpan event DB", e); }
        set((s) => ({ events: [event, ...s.events] }));
        get().addAuditLog("TAMBAH_EVENT", event.title);
      },
      updateEvent: async (id, updates) => {
        try {
          await fetch("/api/events", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...updates }),
          });
        } catch (e) { console.error("Gagal update event DB", e); }
        set((s) => ({
          events: s.events.map((e) => e.id === id ? { ...e, ...updates } : e),
        }));
      },
      deleteEvent: async (id) => {
        try {
          await fetch(`/api/events?id=${id}`, { method: "DELETE" });
        } catch (e) { console.error("Gagal hapus event DB", e); }
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
      addInAppNotification: async (notif) => {
        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notif),
          });
        } catch (e) { console.error("Gagal simpan notif", e); }
        set((s) => ({ inAppNotifications: [notif, ...s.inAppNotifications] }));
      },
      markAsRead: async (id) => {
        try {
          await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notifId: id }),
          });
        } catch (e) { console.error("Gagal mark read notif", e); }
        set((s) => ({
          inAppNotifications: s.inAppNotifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },
      markAllAsRead: async (userId) => {
        try {
          await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
        } catch (e) { console.error("Gagal mark all read", e); }
        set((s) => ({
          inAppNotifications: s.inAppNotifications.map((n) =>
            n.userId === userId ? { ...n, isRead: true } : n
          ),
        }));
      },
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
            // Push semua notifikasi alpa ke DB agar masuk ke semua HP Wali Murid
            Promise.all(newNotifs.map(n => 
              fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(n),
              })
            )).catch(e => console.error("Gagal push notif alpa", e));

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
