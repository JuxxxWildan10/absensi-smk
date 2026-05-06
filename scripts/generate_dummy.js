import fs from 'fs';

const HASHED_PASSWORD = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VkDg9zLHW";

const subjects = [
  "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "Pendidikan Agama", 
  "PPKn", "Sejarah", "PJOK", "Seni Budaya", 
  "Pemrograman Dasar", "Basis Data", "Pemrograman Web",
  "Jaringan Dasar", "Sistem Operasi", "Administrasi Server",
  "Fisika", "Kimia"
];

const newTeachers = [];
let tCount = 3; // Starting from guru-003

subjects.forEach((sub) => {
  newTeachers.push({
    id: `guru-00${tCount}`,
    name: `Guru ${sub}, S.Pd`,
    username: `guru.${sub.toLowerCase().replace(/\s+/g, '')}`,
    password: HASHED_PASSWORD,
    role: "guru",
    nip: `19800101201001${tCount.toString().padStart(4, '0')}`,
    mataPelajaran: [sub],
    phone: `0812345600${tCount.toString().padStart(2, '0')}`,
    createdAt: "2024-01-01T00:00:00.000Z",
    isActive: true,
  });
  tCount++;
});

const classes = [
  "X RPL 1", "X RPL 2", "X RPL 3", "X TKJ 1", "X TKJ 2", "X TKJ 3",
  "XI RPL 1", "XI RPL 2", "XI RPL 3", "XI TKJ 1", "XI TKJ 2", "XI TKJ 3",
  "XII RPL 1", "XII RPL 2", "XII RPL 3", "XII TKJ 1", "XII TKJ 2", "XII TKJ 3"
];

const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const timeSlots = [
  { start: "07:00", end: "08:30" },
  { start: "08:30", end: "10:00" },
  { start: "10:15", end: "11:45" },
  { start: "12:30", end: "14:00" }
];

const schedules = [];
let sId = 1;

classes.forEach((kelas) => {
  const isRPL = kelas.includes("RPL");
  const classSubjects = [
    "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "Pendidikan Agama", 
    "PPKn", "Sejarah", "PJOK", "Seni Budaya",
    ...(isRPL ? ["Pemrograman Dasar", "Basis Data", "Pemrograman Web"] : ["Jaringan Dasar", "Sistem Operasi", "Administrasi Server"]),
    "Fisika", "Kimia"
  ];

  days.forEach((day) => {
    timeSlots.forEach((slot) => {
      // Pick a random subject for this slot
      const sub = classSubjects[Math.floor(Math.random() * classSubjects.length)];
      const teacher = newTeachers.find(t => t.mataPelajaran.includes(sub));
      
      if (teacher) {
        schedules.push({
          id: `sch-${sId++}`,
          kelas: kelas,
          day: day,
          startTime: slot.start,
          endTime: slot.end,
          subjectName: sub,
          teacherId: teacher.id
        });
      }
    });
  });
});

let output = `\n// --- NEW DUMMY TEACHERS ---\nexport const ADDITIONAL_TEACHERS = ${JSON.stringify(newTeachers, null, 2)};\n`;
output += `\n// --- DUMMY SCHEDULES ---\nexport const DUMMY_SCHEDULES = ${JSON.stringify(schedules, null, 2)};\n`;

fs.writeFileSync('d:/absensi-skripsi/src/lib/generated_data.ts', output);
