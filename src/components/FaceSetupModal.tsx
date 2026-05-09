"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Camera, CheckCircle, Loader2, AlertTriangle, UserCheck } from "lucide-react";
import { loadFaceModels, detectFaceWithExpression, drawFaceDetection } from "@/lib/faceRecognition";
import type { Student } from "@/lib/types";

export default function FaceSetupModal() {
  const { currentUser, updateStudent } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loadingModels, setLoadingModels] = useState(true);
  const [streamActive, setStreamActive] = useState(false);
  const [scanStep, setScanStep] = useState<"idle" | "scanning" | "liveness" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [smileDetected, setSmileDetected] = useState(false);
  
  // Hanya jalankan untuk siswa yang belum punya faceDescriptor
  const student = currentUser?.role === "siswa" ? (currentUser as Student) : null;
  const needsSetup = !!student && (!student.faceDescriptor || student.faceDescriptor.length === 0);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (e) {
      setScanStep("error");
      setErrorMsg("Akses kamera ditolak atau kamera tidak tersedia.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      setStreamActive(false);
    }
  };

   
   
  useEffect(() => {
    if (needsSetup) {
      startCamera();
      loadFaceModels().then(() => setLoadingModels(false));
    }
    return () => stopCamera();
  }, [needsSetup]);

  const startRegistration = async () => {
    if (!videoRef.current) return;
    setScanStep("scanning");
    setErrorMsg("");
    setBlinkDetected(false);
    setSmileDetected(false);
    
    let livenessPassed = false;
    let descriptorToSave: Float32Array | null = null;
    
    // Loop deteksi selama maksimal 15 detik
     
    const startTime = Date.now();
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      // Pastikan video sudah ready dan memiliki dimensi
      if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) return;
      
      // Menggambar overlay deteksi wajah (kotak & landmarks)
      try {
        await drawFaceDetection(videoRef.current, canvasRef.current);
        
        // Pengecekan ulang setelah await (untuk mencegah error jika komponen keburu unmount)
        if (!videoRef.current) return;
        
        const result = await detectFaceWithExpression(videoRef.current);
        if (result.descriptor) {
          descriptorToSave = result.descriptor;
          setScanStep("liveness");
          
          if (result.eyeBlink) setBlinkDetected(true);
          if (result.expression === "happy") setSmileDetected(true);
          
          // Membutuhkan 1x senyum ATAU kedip untuk verifikasi pendaftaran awal
          if (blinkDetected || smileDetected) {
            livenessPassed = true;
            clearInterval(interval);
            finishRegistration(descriptorToSave);
          }
        }
      } catch (e) {
        console.error("Face detection error:", e);
      }
      
      if (Date.now() - startTime > 15000) {
        clearInterval(interval);
        if (!livenessPassed) {
          setScanStep("error");
          setErrorMsg("Waktu habis! Liveness gagal terdeteksi. Silakan kedip atau senyum dengan jelas menghadap kamera.");
        }
      }
    }, 500);
  };

  const finishRegistration = (descriptor: Float32Array) => {
    setScanStep("success");
    stopCamera();
    
    // Simpan ke state
    setTimeout(() => {
      if (currentUser?.id) {
        updateStudent(currentUser.id, { faceDescriptor: Array.from(descriptor) });
      }
    }, 1500);
  };

  if (!needsSetup) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "12px",
      overflowY: "auto",
    }}>
      <div className="glass-card animate-fadeInUp" style={{
        width: "100%", maxWidth: 380,
        padding: "20px 16px",
        textAlign: "center",
        background: "#0f1629",
        border: "1px solid rgba(99,102,241,0.3)",
        margin: "auto",
      }}>

        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <UserCheck size={24} color="#6366f1" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Pendaftaran Face ID</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
          Login pertama Anda. Daftarkan wajah untuk keamanan absensi biometrik.
        </p>

        {/* Camera — fixed height agar tidak overflow */}
        <div style={{
          position: "relative", width: "100%", height: 220,
          background: "black", borderRadius: 12, overflow: "hidden", marginBottom: 16,
        }}>
          {loadingModels && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", zIndex: 10 }}>
              <Loader2 className="spinner" size={28} color="#6366f1" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: "white" }}>Memuat modul AI...</div>
            </div>
          )}

          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)", zIndex: 5 }} />

          {scanStep === "liveness" && (
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: "rgba(245,158,11,0.9)", color: "white", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, zIndex: 20, whiteSpace: "nowrap" }}>
              Kedipkan mata / Tersenyum!
            </div>
          )}

          {scanStep === "success" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(16,185,129,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20, color: "white" }}>
              <CheckCircle size={40} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 700 }}>Face ID Tersimpan!</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Mengalihkan...</div>
            </div>
          )}

          {scanStep === "error" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(239,68,68,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20, color: "white", padding: 16 }}>
              <AlertTriangle size={36} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Gagal Merekam</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>{errorMsg}</div>
              <button onClick={() => setScanStep("idle")} style={{ marginTop: 12, background: "white", color: "#ef4444", border: "none", padding: "5px 14px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Coba Lagi</button>
            </div>
          )}
        </div>

        {scanStep === "idle" && (
          <button
            onClick={startRegistration}
            disabled={loadingModels || !streamActive}
            className="btn-primary"
            style={{ width: "100%", padding: "12px", fontSize: 14, opacity: (loadingModels || !streamActive) ? 0.5 : 1 }}
          >
            <Camera size={16} /> Mulai Rekam Wajah
          </button>
        )}
      </div>
    </div>
  );
}
