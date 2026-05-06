"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, User as UserIcon, Lock, AlertCircle, Loader2, Users, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import Link from "next/link";

const ROLE_REDIRECTS: Record<string, string> = {
  admin: "/dashboard/admin",
  guru:  "/dashboard/guru",
  siswa: "/dashboard/siswa",
  wali:  "/dashboard/wali",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  guru:  "Guru & Tendik",
  siswa: "Siswa",
  wali:  "Wali Murid",
};

export default function RoleLoginPage({ params }: { params: Promise<{ role: string }> }) {
  const router = useRouter();
  const { role } = use(params);
  const login = useStore((s) => s.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [kelas, setKelas]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const classes = useStore((s) => s.classes) || ["XII DKV 1", "XI TSM 1"];

  const isValidRole = ["admin", "guru", "siswa", "wali"].includes(role);
  if (!isValidRole) {
    return <div style={{ padding: 48, textAlign: "center" }}>Role tidak valid</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Device binding: ambil atau buat ID unik perangkat ini
    let deviceId = localStorage.getItem("absensi_device_id");
    if (!deviceId) {
      deviceId = "device-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("absensi_device_id", deviceId);
    }

    try {
      // Panggil API login yang terhubung ke Database (Prisma + SQLite)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, kelas, deviceId }),
      });

      const result = await res.json();
      setLoading(false);

      if (!result.success) {
        setError(result.message);
        return;
      }

      // Validasi role sesuai portal yang diakses
      if (result.user?.role !== role) {
        setError(`Akses ditolak! Akun ini bukan terdaftar sebagai ${ROLE_LABELS[role]}.`);
        return;
      }

      // Simpan ke Zustand store (session aktif di browser)
      useStore.setState({
        currentUser: { ...result.user, faceDescriptor: result.user.faceDescriptor ? JSON.parse(result.user.faceDescriptor) : undefined },
        isAuthenticated: true,
      });

      router.push(ROLE_REDIRECTS[role]);

    } catch (err) {
      setLoading(false);
      setError("Gagal terhubung ke server. Periksa koneksi Anda.");
      console.error(err);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--gradient-hero)", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)", top:"-10%", left:"-10%", filter:"blur(40px)" }} />
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)", bottom:"-10%", right:"-10%", filter:"blur(40px)" }} />

      <div style={{ width: "100%", maxWidth: 440, padding: "0 24px", position: "relative", zIndex: 1 }}>
        <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", marginBottom: 24, fontSize: 14, textDecoration: "none" }} className="animate-fadeInUp">
          <ArrowLeft size={16} /> Kembali ke Pilihan Login
        </Link>

        <div style={{ textAlign: "center", marginBottom: 32 }} className="animate-fadeInUp">
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
          }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
            Login <span className="gradient-text">{ROLE_LABELS[role]}</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            Portal Absensi SMK Arya Singasari
          </p>
        </div>

        <div className="glass-card animate-fadeInUp stagger-1" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Username / NIP / NIS
              </label>
              <div style={{ position: "relative" }}>
                <UserIcon size={16} color="var(--text-muted)" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
                <input type="text" className="input-field" style={{ paddingLeft: 42 }} placeholder="Masukkan identitas..." value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="var(--text-muted)" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} />
                <input type={showPass ? "text" : "password"} className="input-field" style={{ paddingLeft: 42, paddingRight: 42 }} placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {role === "siswa" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  Pilih Kelas
                </label>
                <div style={{ position: "relative" }}>
                  <Users size={16} color="var(--text-muted)" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", zIndex: 2 }} />
                  <select className="input-field" style={{ paddingLeft: 42, appearance: "none" }} value={kelas} onChange={(e) => setKelas(e.target.value)} required>
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"var(--radius-md)", color:"#ef4444", fontSize:13 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width:"100%", justifyContent:"center", marginTop:4, opacity: loading ? 0.7 : 1 }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</> : "Masuk ke Portal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
