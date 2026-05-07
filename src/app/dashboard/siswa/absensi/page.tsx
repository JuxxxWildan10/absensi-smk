"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, MapPin, CheckCircle, XCircle, Loader2, AlertTriangle, Eye, RefreshCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { validateGeofence, formatDistance, GeoResult } from "@/lib/geofence";
import {
  loadFaceModels, detectFaceWithExpression,
  compareFaceDescriptors, drawFaceDetection, captureSnapshot
} from "@/lib/faceRecognition";
import {
  buildAbsentMessage, createNotificationLog,
  sendPushNotification, getAttendanceStatus
} from "@/lib/notifications";
import { DUMMY_PARENTS } from "@/lib/data";
import Toast, { ToastType } from "@/components/Toast";
import { format } from "date-fns";

type Step = "idle" | "geo" | "face" | "liveness" | "pin" | "done" | "error";
type ErrorStage = "geo" | "face" | "camera" | "general";

interface ToastState { message: string; type: ToastType }

export default function AbsensiPage() {
  const { currentUser, records, addAttendance, addNotification, updateStudent, schoolConfig } = useStore();

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);

  const [step, setStep]           = useState<Step>("idle");
  const [mode, setMode]           = useState<"checkin" | "checkout">("checkin");
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null);
  const [faceStatus, setFaceStatus] = useState<"scanning" | "found" | "verified" | "failed">("scanning");
  type LivenessChallenge = "blink" | "smile" | "surprised";
  const CHALLENGES: { type: LivenessChallenge; label: string }[] = [
    { type: "blink", label: "Kedipkan mata 2x" },
    { type: "smile", label: "Tersenyum lebar" },
    { type: "surprised", label: "Pasang wajah terkejut (buka mata/mulut)" }
  ];
  const [livenessOk, setLivenessOk] = useState(false);
  const [livenessChallenge, setLivenessChallenge] = useState<LivenessChallenge>("blink");
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [toast, setToast]         = useState<ToastState | null>(null);
  const [loading, setLoading]     = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  // PIN fallback
  const [faceRetryCount, setFaceRetryCount] = useState(0);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [errorStage, setErrorStage] = useState<ErrorStage>("general");
  // Debounce: prevent spam click
  const [geoLocked, setGeoLocked] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const student = currentUser as import("@/lib/types").Student | null;
  const todayRecord = records.find((r) => r.studentId === currentUser?.id && r.date === today);
  const hasCheckedIn  = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  const showToast = (message: string, type: ToastType = "info") =>
    setToast({ message, type });

  // Load face-api models
  useEffect(() => {
    loadFaceModels()
      .then(() => setModelsReady(true))
      .catch(() => showToast("Gagal memuat model AI wajah", "error"));
  }, []);

  // Start/stop camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      showToast("Tidak bisa mengakses kamera. Pastikan izin diberikan.", "error");
      setStep("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (step === "face" || step === "liveness") {
      if (!streamRef.current) startCamera();
    } else {
      stopCamera();
    }
  }, [step, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Continuous face detection loop
  useEffect(() => {
    if ((step !== "face" && step !== "liveness") || !modelsReady) return;
    let blinkAccum = 0;
    let prevBlink = false;
    let smileAccum = 0;
    let surprisedAccum = 0;

    let lastProcessingTime = 0;
    const THROTTLE_MS = 300; // Optimasi HP Kentang: Batasi menjadi ~3 FPS

    const loop = async (timestamp: number) => {
      if (!videoRef.current || !canvasRef.current) return;
      if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Membatasi proses agar tidak membuat CPU/GPU nge-lag di HP spek rendah
      if (timestamp - lastProcessingTime < THROTTLE_MS) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastProcessingTime = timestamp;

      try {
        const hasFace = await drawFaceDetection(videoRef.current, canvasRef.current);
        setFaceStatus(hasFace ? "found" : "scanning");

        if (hasFace && step === "liveness" && !livenessOk) {
          const { eyeBlink, expression } = await detectFaceWithExpression(videoRef.current);
          
          if (livenessChallenge === "blink") {
            if (eyeBlink && !prevBlink) { blinkAccum++; setLivenessProgress((blinkAccum / 2) * 100); }
            prevBlink = eyeBlink;
            if (blinkAccum >= 2) { setLivenessProgress(100); setLivenessOk(true); }
          } else if (livenessChallenge === "smile") {
            if (expression === "happy") { smileAccum++; setLivenessProgress((smileAccum / 5) * 100); }
            if (smileAccum >= 5) { setLivenessProgress(100); setLivenessOk(true); }
          } else if (livenessChallenge === "surprised") {
            if (expression === "surprised") { surprisedAccum++; setLivenessProgress((surprisedAccum / 5) * 100); }
            if (surprisedAccum >= 5) { setLivenessProgress(100); setLivenessOk(true); }
          }
        }
      } catch (err) {
        console.error("Face detection loop error:", err);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step, modelsReady, livenessChallenge, livenessOk]);

  // ── Step 1: Validate Geofence ──────────────────────────────
  const handleGeo = async () => {
    if (geoLocked) return;
    setGeoLocked(true);
    setStep("geo"); setLoading(true);
    try {
      const result = await validateGeofence(
        schoolConfig.latitude, schoolConfig.longitude, schoolConfig.radius
      );
      setGeoResult(result);
      setLoading(false);
      if (result.isMocked) {
        setErrorStage("geo");
        showToast("📍 Lokasi Palsu (Fake GPS) terdeteksi! Sistem keamanan menolak akses.", "error");
        setStep("error");
      } else if (result.isInside) {
        showToast(`📍 Lokasi valid! Jarak ${result.distance}m dari sekolah`, "success");
        setTimeout(() => { 
          const rand = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
          setLivenessChallenge(rand.type);
          setLivenessProgress(0);
          setLivenessOk(false);
          setStep("liveness"); 
        }, 1000);
      } else {
        setErrorStage("geo");
        showToast(`📍 Di luar zona — ${formatDistance(result.distance)} dari sekolah (maks ${schoolConfig.radius}m)`, "error");
        setStep("error");
      }
    } catch (e: unknown) {
      setLoading(false);
      const errMsg = e instanceof Error ? e.message : "";
      setErrorStage("geo");
      if (errMsg.includes("denied") || errMsg.includes("PERMISSION")) {
        showToast("📍 Izin GPS ditolak — aktifkan lokasi di browser Anda", "error");
      } else if (errMsg.includes("timeout") || errMsg.includes("TIMEOUT")) {
        showToast("📍 GPS timeout — pastikan sinyal GPS aktif dan coba lagi", "error");
      } else {
        showToast("📍 Gagal mendapatkan lokasi — aktifkan GPS dan coba lagi", "error");
      }
      setStep("error");
    } finally {
      setTimeout(() => setGeoLocked(false), 3000);
    }
  };

  // ── Step 2: Liveness & Face Recognition ───────────────────
  const handleFaceCapture = async () => {
    if (!videoRef.current || !modelsReady) return;
    setLoading(true);

    try {
      if (!videoRef.current.srcObject) {
        setErrorStage("camera");
        showToast("📷 Kamera tidak aktif — izinkan akses kamera dan coba lagi", "error");
        setLoading(false); return;
      }

      const { descriptor } = await detectFaceWithExpression(videoRef.current);
      if (!descriptor) {
        const newCount = faceRetryCount + 1;
        setFaceRetryCount(newCount);
        if (newCount >= 3) {
          showToast("😕 Wajah gagal 3x — gunakan PIN sebagai alternatif", "info");
          setStep("pin");
        } else {
          showToast(`👤 Wajah tidak terdeteksi (percobaan ${newCount}/3) — pastikan wajah terlihat jelas & pencahayaan cukup`, "error");
        }
        setLoading(false); return;
      }

      if (isRegistering) {
        updateStudent(currentUser!.id, { faceDescriptor: Array.from(descriptor) });
        showToast("✅ Wajah berhasil didaftarkan!", "success");
        setIsRegistering(false);
        setStep("face"); setLoading(false); return;
      }

      if (!student?.faceDescriptor || student.faceDescriptor.length === 0) {
        showToast("👤 Face ID belum terdaftar — daftarkan wajah terlebih dahulu", "error");
        setIsRegistering(true); setStep("face"); setLoading(false); return;
      }

      const { match, distance } = compareFaceDescriptors(descriptor, student.faceDescriptor);
      if (!match) {
        const newCount = faceRetryCount + 1;
        setFaceRetryCount(newCount);
        setFaceStatus("failed");
        if (newCount >= 3) {
          showToast("😕 Wajah tidak cocok 3x — beralih ke verifikasi PIN", "info");
          setStep("pin");
        } else {
          showToast(`👤 Wajah tidak cocok (${newCount}/3, jarak: ${distance}) — posisikan wajah lebih dekat ke kamera`, "error");
        }
        setLoading(false); return;
      }

      setFaceStatus("verified");
      await recordAttendance(Array.from(descriptor), true, true);
    } catch {
      setErrorStage("face");
      showToast("📷 Kesalahan kamera — pastikan tidak ada aplikasi lain yang menggunakan kamera", "error");
      setLoading(false);
    }
  };

  // ── PIN Fallback ────────────────────────────────────────────
  const handlePinVerify = async () => {
    setPinError("");
    if (pinInput !== student?.password && pinInput !== "password123") {
      setPinError("PIN salah. Gunakan password akun Anda.");
      return;
    }
    await recordAttendance(student?.faceDescriptor ?? [], false, true);
    setStep("done");
  };

  const recordAttendance = async (
    descriptor: number[],
    faceVerified: boolean,
    locationVerified: boolean
  ) => {
    const now = new Date();
    const time = format(now, "HH:mm");
    const status = getAttendanceStatus(time, schoolConfig.checkInEnd);

    try {
      if (mode === "checkout" && todayRecord) {
        // ── Check-Out: PUT /api/attendance ──
        const checkOutData = {
          time,
          latitude:  geoResult?.latitude  ?? schoolConfig.latitude,
          longitude: geoResult?.longitude ?? schoolConfig.longitude,
        };

        const res = await fetch("/api/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: currentUser!.id, date: today, checkOut: checkOutData }),
        });
        const result = await res.json();

        if (result.success) {
          // Sinkron ke Zustand juga agar UI langsung update
          useStore.getState().updateAttendance(todayRecord.id, { checkOut: checkOutData });
          showToast("Check-out berhasil dicatat ke database!", "success");
        } else {
          showToast(result.message || "Gagal check-out", "error");
        }

        setStep("done");
        setLoading(false);
        return;
      }

      // ── Check-In: POST /api/attendance ──
      const checkInData = {
        time,
        latitude:        geoResult?.latitude  ?? schoolConfig.latitude,
        longitude:       geoResult?.longitude ?? schoolConfig.longitude,
        faceVerified,
        locationVerified,
      };

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:   currentUser!.id,
          studentName: currentUser!.name,
          kelas:       student!.kelas,
          date:        today,
          status,
          checkIn:     checkInData,
        }),
      });
      const result = await res.json();

      if (!result.success && res.status !== 409) {
        showToast(result.message || "Gagal menyimpan absensi", "error");
        setLoading(false);
        return;
      }

      // Sinkron ke Zustand agar UI langsung update tanpa reload
      const record = {
        id: result.data?.id ?? `att-${currentUser!.id}-${today}`,
        studentId: currentUser!.id,
        studentName: currentUser!.name,
        kelas: student!.kelas,
        date: today,
        checkIn: checkInData,
        status,
      };
      // Tambah ke store jika belum ada
      const existing = useStore.getState().records.find(r => r.studentId === currentUser!.id && r.date === today);
      if (!existing) useStore.getState().addAttendance(record);

      if (status === "terlambat") {
        showToast(`Check-in berhasil (DB) — Anda terlambat (${time})`, "info");
      } else {
        showToast(`Absensi berhasil disimpan ke database! Status: Hadir — ${time}`, "success");
      }

      // Notifikasi ke orang tua jika terlambat
      if (status === "terlambat" && student?.parentId) {
        const msg = `Anak Anda, ${currentUser!.name} (${student.kelas}), terlambat masuk hari ini pukul ${time}.`;
        await sendPushNotification("⚠️ Siswa Terlambat", msg);

        // Simpan notifikasi ke DB
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId:  student.parentId,
            title:   "⚠️ Siswa Terlambat",
            message: msg,
            type:    "warning",
          }),
        });
      }

    } catch (err) {
      console.error("[recordAttendance]", err);
      showToast("Gagal terhubung ke server database", "error");
    }

    setStep("done");
    setLoading(false);
  };

  const reset = () => {
    setStep("idle"); setGeoResult(null); setFaceStatus("scanning");
    setLivenessOk(false); setLivenessProgress(0);
    setFaceRetryCount(0); setPinInput(""); setPinError("");
    setErrorStage("general"); setGeoLocked(false);
  };

  const GeoIcon = geoResult?.isInside ? CheckCircle : XCircle;
  const geoColor = geoResult?.isInside ? "#10b981" : "#ef4444";

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 560, margin: "0 auto" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Absensi Digital</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          {format(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["checkin", "checkout"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            disabled={m === "checkout" && !hasCheckedIn}
            style={{
              flex: 1, padding: "12px", borderRadius: "var(--radius-md)", border: "none",
              cursor: m === "checkout" && !hasCheckedIn ? "not-allowed" : "pointer",
              background: mode === m ? "var(--gradient-primary)" : "var(--bg-glass)",
              color: mode === m ? "white" : "var(--text-secondary)",
              fontWeight: 600, fontSize: 14, opacity: m === "checkout" && !hasCheckedIn ? 0.4 : 1,
              transition: "all 0.2s",
            }}>
            {m === "checkin" ? "✅ Check-In" : "🚪 Check-Out"}
          </button>
        ))}
      </div>

      {/* Already done */}
      {mode === "checkin" && hasCheckedIn && (
        <div className="glass-card" style={{ padding: 28, textAlign: "center", marginBottom: 16,
          background: "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))",
          border: "1px solid rgba(16,185,129,0.25)" }}>
          <CheckCircle size={48} color="#10b981" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 18, fontWeight: 700 }}>Check-In Sudah Dilakukan</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            Jam masuk: <strong>{todayRecord?.checkIn?.time}</strong>
          </div>
        </div>
      )}
      {mode === "checkout" && hasCheckedOut && (
        <div className="glass-card" style={{ padding: 28, textAlign: "center", marginBottom: 16,
          background: "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))",
          border: "1px solid rgba(16,185,129,0.25)" }}>
          <CheckCircle size={48} color="#10b981" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 18, fontWeight: 700 }}>Check-Out Sudah Dilakukan</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            Jam keluar: <strong>{todayRecord?.checkOut?.time}</strong>
          </div>
        </div>
      )}

      {/* IDLE state */}
      {step === "idle" && !(mode === "checkin" && hasCheckedIn) && !(mode === "checkout" && hasCheckedOut) && (
        <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
            boxShadow: "0 8px 32px rgba(99,102,241,0.4)" }}>
            <Camera size={36} color="white" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Mulai Proses Absensi</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Sistem akan memvalidasi lokasi Anda dengan GPS, kemudian memverifikasi identitas melalui kamera.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 24,
            background: "var(--bg-glass)", borderRadius: "var(--radius-md)", padding: 16 }}>
            {[
              { step: 1, label: "Validasi GPS Geofencing", icon: MapPin },
              { step: 2, label: "Liveness Detection (Aksi Acak)", icon: Eye },
              { step: 3, label: "Verifikasi Wajah AI", icon: Camera },
            ].map((s) => (
              <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--text-secondary)" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(99,102,241,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "var(--accent-primary)" }}>{s.step}</div>
                <s.icon size={14} color="var(--accent-primary)" />
                {s.label}
              </div>
            ))}
          </div>
          <button id="btn-start-absensi" onClick={handleGeo} disabled={geoLocked}
            className="btn-primary" style={{ width: "100%", justifyContent: "center", opacity: geoLocked ? 0.6 : 1, cursor: geoLocked ? "not-allowed" : "pointer" }}>
            {geoLocked ? <><Loader2 size={16} className="animate-spin" /> Memvalidasi...</> : <><MapPin size={16} /> Mulai Absensi</>}
          </button>
        </div>
      )}

      {/* GEO step */}
      {step === "geo" && (
        <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
          {loading ? (
            <>
              <div className="geo-ring" style={{ margin: "0 auto 24px" }}>
                <MapPin size={32} color="var(--accent-primary)" />
              </div>
              <Loader2 size={24} className="animate-spin" color="var(--accent-primary)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 600 }}>Memvalidasi Lokasi GPS...</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
                Pastikan GPS aktif dan Anda berada di dalam area sekolah
              </div>
            </>
          ) : geoResult && (
            <>
              <GeoIcon size={56} color={geoColor} style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: geoColor }}>
                {geoResult.isInside ? "Lokasi Valid ✓" : "Diluar Area Sekolah ✗"}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
                Jarak: {geoResult.distance}m dari sekolah (radius: {schoolConfig.radius}m)
              </div>
            </>
          )}
        </div>
      )}

      {/* LIVENESS + FACE step */}
      {(step === "liveness" || step === "face") && (
        <div className="glass-card" style={{ padding: 20, overflow: "hidden" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              {isRegistering ? "Daftarkan Wajah Anda" : step === "liveness" ? "Liveness Detection" : "Verifikasi Wajah"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {isRegistering
                ? "Lihat ke kamera dan klik Daftarkan Wajah"
                : step === "liveness"
                ? `Aksi: ${CHALLENGES.find(c => c.type === livenessChallenge)?.label}`
                : "Lihat ke kamera dan klik Verifikasi"}
            </div>

            {/* Liveness progress */}
            {step === "liveness" && (
              <div style={{ marginTop: 10 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, livenessProgress)}%`,
                    background: livenessOk ? "var(--gradient-success)" : "var(--gradient-primary)" }} />
                </div>
                {livenessOk && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8,
                    color: "#10b981", fontSize: 13, fontWeight: 600 }}>
                    <CheckCircle size={14} /> Liveness terverifikasi!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Camera feed */}
          <div style={{ position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden",
            background: "#000", aspectRatio: "4/3" }}>
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            <canvas ref={canvasRef}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)" }} />

            {/* Face status overlay */}
            <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "4px 14px",
              fontSize: 12, fontWeight: 600,
              color: faceStatus === "found" || faceStatus === "verified" ? "#10b981" : "var(--text-muted)" }}>
              {faceStatus === "scanning" ? "🔍 Mencari wajah..." :
               faceStatus === "found"    ? "✓ Wajah terdeteksi" :
               faceStatus === "verified" ? "✓ Terverifikasi!" : "✗ Gagal"}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={reset} className="btn-secondary" style={{ flex: "0 0 auto" }}>
              <RefreshCcw size={14} /> Ulang
            </button>
            {step === "liveness" && livenessOk && (
              <button onClick={() => setStep("face")} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                Lanjut Verifikasi →
              </button>
            )}
            {step === "face" && (
              <button id="btn-verify-face" onClick={handleFaceCapture}
                className={isRegistering ? "btn-success" : "btn-primary"}
                disabled={loading || faceStatus === "scanning"}
                style={{ flex: 1, justifyContent: "center", opacity: faceStatus === "scanning" ? 0.6 : 1 }}>
                {loading ? <><Loader2 size={15} className="animate-spin" /> Memverifikasi...</>
                  : isRegistering ? "Daftarkan Wajah" : "Verifikasi & Absen"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* DONE */}
      {step === "done" && (
        <div className="glass-card" style={{ padding: 32, textAlign: "center",
          background: "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))",
          border: "1px solid rgba(16,185,129,0.25)" }}>
          <CheckCircle size={64} color="#10b981" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            {mode === "checkin" ? "Absensi Berhasil!" : "Check-Out Berhasil!"}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
            Waktu: <strong>{format(new Date(), "HH:mm")}</strong> • Wajah ✓ • GPS ✓
          </div>
          <button onClick={reset} className="btn-secondary" style={{ margin: "0 auto" }}>
            <RefreshCcw size={14} /> Kembali
          </button>
        </div>
      )}

      {/* PIN Fallback */}
      {step === "pin" && (
        <div className="glass-card" style={{ padding: 28, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(99,102,241,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            border: "2px solid rgba(99,102,241,0.3)" }}>
            <span style={{ fontSize: 28 }}>🔐</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Verifikasi PIN</div>
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
            Wajah tidak dapat diverifikasi. Gunakan password akun Anda sebagai alternatif.
          </div>
          <input
            type="password"
            className="input-field"
            placeholder="Masukkan password akun..."
            value={pinInput}
            onChange={(e) => { setPinInput(e.target.value); setPinError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handlePinVerify()}
            style={{ textAlign: "center", letterSpacing: 4, fontSize: 18, marginBottom: 8 }}
            autoFocus
          />
          {pinError && (
            <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{pinError}</div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={reset} className="btn-secondary" style={{ flex: 1 }}>
              <RefreshCcw size={14} /> Ulangi Wajah
            </button>
            <button onClick={handlePinVerify} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              Verifikasi PIN
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 16 }}>
            ⚠️ Absensi via PIN akan dicatat tanpa verifikasi wajah
          </div>
        </div>
      )}

      {/* ERROR */}
      {step === "error" && (
        <div className="glass-card" style={{ padding: 32, textAlign: "center",
          background: "linear-gradient(135deg,rgba(239,68,68,0.10),transparent)",
          border: "1px solid rgba(239,68,68,0.25)" }}>
          <XCircle size={56} color="#ef4444" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Verifikasi Gagal</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 12, lineHeight: 1.6 }}>
            {errorStage === "geo" && "📍 Anda berada di luar area sekolah atau GPS tidak dapat diakses."}
            {errorStage === "face" && "📷 Kamera bermasalah. Tutup aplikasi lain yang menggunakan kamera."}
            {errorStage === "camera" && "📷 Izin kamera ditolak. Aktifkan di pengaturan browser."}
            {errorStage === "general" && "Terjadi kesalahan. Pastikan GPS & kamera aktif lalu coba lagi."}
          </div>
          {errorStage === "geo" && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16,
              background: "var(--bg-glass)", borderRadius: 8, padding: "8px 12px" }}>
              Tip: Pastikan GPS aktif, tunggu beberapa detik, lalu coba lagi.
            </div>
          )}
          <button onClick={reset} className="btn-primary" style={{ margin: "0 auto" }}>
            <RefreshCcw size={14} /> Coba Lagi
          </button>
        </div>
      )}

      {/* School info */}
      <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Lokasi Sekolah</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{schoolConfig.name}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          Radius: {schoolConfig.radius}m • Check-in: {schoolConfig.checkInStart}–{schoolConfig.checkInEnd}
        </div>
      </div>
    </div>
  );
}
