"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { User, Save, Lock, Eye, EyeOff, Shield } from "lucide-react";
import Toast, { ToastType } from "@/components/Toast";

export default function WaliProfilPage() {
  const { currentUser, updateProfile } = useStore();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: currentUser?.name ?? "", phone: currentUser?.phone ?? "", waNumber: "" });
  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });
  const [showPwdSection, setShowPwdSection] = useState(false);

  if (!currentUser) return null;
  const wali = currentUser as import("@/lib/types").Parent;

  const handleSave = () => {
    updateProfile({ name: form.name, phone: form.phone });
    setToast({ message: "Profil berhasil diperbarui!", type: "success" });
  };

  const handleChangePwd = () => {
    if (pwd.current !== "password123") { setToast({ message: "Password saat ini salah", type: "error" }); return; }
    if (pwd.newPwd.length < 8) { setToast({ message: "Password baru minimal 8 karakter", type: "error" }); return; }
    if (pwd.newPwd !== pwd.confirm) { setToast({ message: "Konfirmasi password tidak sesuai", type: "error" }); return; }
    setPwd({ current: "", newPwd: "", confirm: "" });
    setShowPwdSection(false);
    setToast({ message: "Password berhasil diubah!", type: "success" });
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 640 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Profil Saya</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Kelola informasi akun wali murid Anda.</p>
      </div>

      {/* Header card */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20, background: "linear-gradient(135deg,rgba(245,158,11,0.08),rgba(217,119,6,0.04))", border: "1px solid rgba(245,158,11,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: "var(--gradient-warning)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "white" }}>
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{currentUser.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>{currentUser.username}</div>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontWeight: 600 }}>Wali Murid</span>
          </div>
        </div>
      </div>

      {/* Edit info */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <User size={18} color="#f59e0b" /> Informasi Pribadi
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Nama Lengkap</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Email</label>
            <input className="input-field" value={currentUser.username} disabled style={{ opacity: 0.5 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Nomor HP</label>
            <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Nomor WhatsApp</label>
            <input className="input-field" value={wali.waNumber || ""} placeholder="62812xxxxxxx" readOnly style={{ opacity: 0.7 }} />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Hubungi admin untuk mengubah nomor WhatsApp</div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn-primary" onClick={handleSave}>
              <Save size={16} /> Simpan Perubahan
            </button>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showPwdSection ? 16 : 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={18} color="#f59e0b" /> Ubah Password
          </div>
          <button onClick={() => setShowPwdSection(!showPwdSection)} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 13 }}>
            {showPwdSection ? "Batal" : "Ubah"}
          </button>
        </div>
        {showPwdSection && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Password Saat Ini", key: "current", value: pwd.current },
              { label: "Password Baru", key: "newPwd", value: pwd.newPwd },
              { label: "Konfirmasi", key: "confirm", value: pwd.confirm },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} className="input-field"
                    value={f.value} onChange={e => setPwd(p => ({ ...p, [f.key]: e.target.value }))} style={{ paddingRight: 40 }} />
                  <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-primary" onClick={handleChangePwd}><Lock size={16} /> Ganti Password</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
