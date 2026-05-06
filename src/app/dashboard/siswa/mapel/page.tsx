"use client";
import { useStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { Clock, BookOpen, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Student } from "@/lib/types";

export default function SiswaMapelPage() {
  const { currentUser, schedules, teachers, subjectRecords, addSubjectRecord, updateSubjectRecord, students } = useStore();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDay, setCurrentDay] = useState("");
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [hasAbsented, setHasAbsented] = useState(false);

  const student = currentUser as Student;
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);

      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      setCurrentDay(days[now.getDay()]);
    };

    updateClock();
    const interval = setInterval(updateClock, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!student || !currentDay) return;

    // Simulate "08:45" mapping to active schedule
    const active = schedules.find(s => {
      return s.kelas === student.kelas && s.day === currentDay && s.startTime <= currentTime && s.endTime >= currentTime;
    });

    // If testing outside school hours, maybe just pick the first schedule of the day
    // Uncomment this for easy testing if needed:
    // const active = schedules.find(s => s.kelas === student.kelas && s.day === currentDay);

    setActiveSchedule(active || null);

    if (active) {
      // Check if student already checked in for this subject today
      const existingRecord = subjectRecords.find(r => 
        r.date === todayStr && 
        r.subjectName === active.subjectName && 
        r.kelas === active.kelas && 
        r.teacherId === active.teacherId
      );

      if (existingRecord && existingRecord.presentStudentIds.includes(student.id)) {
        setHasAbsented(true);
      } else {
        setHasAbsented(false);
      }
    }
  }, [student, currentDay, currentTime, schedules, subjectRecords, todayStr]);

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || "Unknown";

  const handleAbsenMapel = () => {
    if (!activeSchedule) return;

    const existingRecord = subjectRecords.find(r => 
      r.date === todayStr && 
      r.subjectName === activeSchedule.subjectName && 
      r.kelas === activeSchedule.kelas && 
      r.teacherId === activeSchedule.teacherId
    );

    if (existingRecord) {
      updateSubjectRecord(existingRecord.id, {
        presentStudentIds: [...new Set([...existingRecord.presentStudentIds, student.id])],
        absentStudentIds: existingRecord.absentStudentIds.filter(id => id !== student.id)
      });
    } else {
      // Create new record for the day
      const classStudents = students.filter(s => s.kelas === student.kelas).map(s => s.id);
      addSubjectRecord({
        id: uuidv4(),
        subjectName: activeSchedule.subjectName,
        teacherId: activeSchedule.teacherId,
        kelas: activeSchedule.kelas,
        date: todayStr,
        session: 1, // simplified
        presentStudentIds: [student.id],
        absentStudentIds: classStudents.filter(id => id !== student.id),
        createdAt: new Date().toISOString()
      });
    }

    setHasAbsented(true);
    alert(`Berhasil absen untuk mata pelajaran ${activeSchedule.subjectName}!`);
  };

  if (!student) return null;

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Absensi Mata Pelajaran</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Konfirmasi kehadiran Anda di jam pelajaran saat ini.</p>
        </div>
        <div style={{ background: "var(--bg-secondary)", padding: "8px 16px", borderRadius: 12, border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: 12 }}>
          <Clock size={16} color="var(--text-secondary)" />
          <span style={{ fontWeight: 600, fontFamily: "monospace", fontSize: 16 }}>{currentTime}</span>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{currentDay}</span>
        </div>
      </div>

      {!activeSchedule ? (
        <div className="glass-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Calendar size={32} color="var(--text-muted)" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Tidak Ada Kelas Saat Ini</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Anda tidak memiliki jadwal mata pelajaran pada jam {currentTime} ini.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "0 10px 20px rgba(99,102,241,0.2)" }}>
            <BookOpen size={40} color="white" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{activeSchedule.subjectName}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, marginBottom: 24 }}>Guru: {getTeacherName(activeSchedule.teacherId)}</p>
          
          <div style={{ background: "var(--bg-secondary)", padding: "12px 24px", borderRadius: 12, border: "1px solid var(--border-glass)", marginBottom: 32, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Kelas</span>
              <span style={{ fontWeight: 600 }}>{activeSchedule.kelas}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Jam Pelajaran</span>
              <span style={{ fontWeight: 600 }}>{activeSchedule.startTime} - {activeSchedule.endTime}</span>
            </div>
          </div>

          {hasAbsented ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "16px 32px", borderRadius: 100, fontWeight: 600, width: "100%", justifyContent: "center" }}>
              <CheckCircle size={20} />
              Anda sudah absen hadir
            </div>
          ) : (
            <button onClick={handleAbsenMapel} className="btn-primary" style={{ width: "100%", padding: 16, fontSize: 16, borderRadius: 100 }}>
              Konfirmasi Kehadiran Sekarang
            </button>
          )}
        </div>
      )}
    </div>
  );
}
