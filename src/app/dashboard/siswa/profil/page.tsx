"use client";
import { useStore } from "@/lib/store";
import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, UserCheck, Loader2, CheckCircle, RefreshCcw } from "lucide-react";
import { loadFaceModels, detectFaceDescriptor, drawFaceDetection } from "@/lib/faceRecognition";
import Toast, { ToastType } from "@/components/Toast";

interface ToastState { message: string; type: ToastType }

export default function SiswaProfilPage() {
  const { currentUser, updateStudent } = useStore();
  const student = currentUser as import("@/lib/types").Student;

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);

  const [cameraOn, setCameraOn]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [registered, setRegistered] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [toast, setToast]         = useState<ToastState | null>(null);

  useEffect(() => {
    loadFaceModels().then(() => setModelsReady(true));
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setCameraOn(true);

      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          const loop = async () => {
            if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
              try {
                await drawFaceDetection(videoRef.current, canvasRef.current);
              } catch (err) {}
            }
            rafRef.current = requestAnimationFrame(loop);
          };
          rafRef.current = requestAnimationFrame(loop);
        }
      }, 100);
    } catch {
      setToast({ message: "Tidak bisa mengakses kamera", type: "error" });
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCameraOn(false);
  }, []);

  const registerFace = async () => {
    if (!videoRef.current || !modelsReady) return;
    setLoading(true);
    const descriptor = await detectFaceDescriptor(videoRef.current);
    if (!descriptor) {
      setToast({ message: "Wajah tidak terdeteksi. Posisikan wajah di tengah kamera.", type: "error" });
      setLoading(false);
      return;
    }
    updateStudent(currentUser!.id, { faceDescriptor: Array.from(descriptor) });
    setRegistered(true);
    setToast({ message: "Face ID berhasil didaftarkan! Sekarang Anda bisa absen dengan wajah.", type: "success" });
    stopCamera();
    setLoading(false);
  };

  if (!student) return null;

  const hasFaceId = student.faceDescriptor && student.faceDescriptor.length > 0;

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 600, margin: "0 auto" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Profil Saya</h1>

      {/* Profile card */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "white", flexShrink: 0 }}>
            {student.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{student.name}</div>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>{student.username}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <span className="badge badge-purple">{student.kelas}</span>
              <span className="badge badge-info">{student.jurusan}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "NISN",   value: student.nisn },
            { label: "Kelas",  value: student.kelas },
            { label: "Jurusan",value: student.jurusan },
            { label: "Telepon",value: student.phone ?? "–" },
          ].map((f) => (
            <div key={f.label} style={{ background: "var(--bg-glass)", borderRadius: "var(--radius-md)", padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Face ID registration */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <Camera size={18} color="var(--accent-primary)" /> Pendaftaran Face ID
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Daftarkan wajah Anda agar bisa melakukan absensi dengan verifikasi biometrik.
          Pastikan pencahayaan baik dan wajah terlihat jelas.
        </p>

        {(hasFaceId || registered) && !cameraOn && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: "var(--radius-md)", marginBottom: 16 }}>
            <CheckCircle size={20} color="#10b981" />
            <div>
              <div style={{ fontWeight: 600, color: "#10b981", fontSize: 14 }}>Face ID Terdaftar</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Wajah Anda sudah terdaftar dalam sistem</div>
            </div>
          </div>
        )}

        {cameraOn && (
          <div style={{ marginBottom: 16, position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden", aspectRatio: "4/3", background: "#000" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)" }} />
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "var(--text-muted)" }}>
              Posisikan wajah di tengah frame
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {!cameraOn ? (
            <button onClick={startCamera} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              <Camera size={15} /> {hasFaceId ? "Perbarui Face ID" : "Daftarkan Face ID"}
            </button>
          ) : (
            <>
              <button onClick={stopCamera} className="btn-secondary">
                <RefreshCcw size={14} /> Batal
              </button>
              <button onClick={registerFace} disabled={loading || !modelsReady}
                className="btn-success" style={{ flex: 1, justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
                {loading ? <><Loader2 size={14} className="animate-spin" /> Mendaftarkan...</> : <><UserCheck size={14} /> Simpan Face ID</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
