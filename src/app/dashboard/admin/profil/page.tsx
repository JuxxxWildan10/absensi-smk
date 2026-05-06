"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { User, Save, Lock, Eye, EyeOff, Shield } from "lucide-react";
import Toast, { ToastType } from "@/components/Toast";

export default function AdminProfilPage() {
  const { currentUser, updateProfile } = useStore();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ name: currentUser?.name ?? "", phone: currentUser?.phone ?? "" });
  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });

  if (!currentUser) return null;

  const handleSave = () => {
    if (!form.name.trim()) { setToast({ message: "Nama tidak boleh kosong", type: "error" }); return; }
    updateProfile({ name: form.name, phone: form.phone });
    setToast({ message: "Profil berhasil diperbarui!", type: "success" });
  };

  const handleChangePwd = () => {
    if (pwd.current !== "password123") { setToast({ message: "Password saat ini salah", type: "error" }); return; }
    if (pwd.newPwd.length < 8) { setToast({ message: "Password baru minimal 8 karakter", type: "error" }); return; }
    if (pwd.newPwd !== pwd.confirm) { setToast({ message: "Konfirmasi tidak sesuai", type: "error" }); return; }
    setPwd({ current: "", newPwd: "", confirm: "" });
    setShowPwdSection(false);
    setToast({ message: "Password berhasil diubah!", type: "success" });
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 640 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Profil Administrator</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Kelola informasi akun administrator sistem.</p>
      </div>

      {/* Header */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20, background: "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05))", border: "1px solid rgba(99,102,241,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "white" }}>
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{currentUser.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>{currentUser.username}</div>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "rgba(99,102,241,0.15)", color: "#6366f1", fontWeight: 600 }}>
              Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Edit */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <User size={18} color="var(--accent-primary)" /> Informasi Pribadi
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
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn-primary" onClick={handleSave} id="btn-simpan-profil-admin">
              <Save size={16} /> Simpan
            </button>
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={18} color="var(--accent-primary)" /> Informasi Sistem
        </div>
        {[
          { label: "Role", value: "Administrator Penuh" },
          { label: "Bergabung Sejak", value: new Date(currentUser.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) },
          { label: "Status", value: "Aktif" },
          { label: "Versi Sistem", value: "AbsensiCerdas v2.0.0 PWA" },
        ].map(i => (
          <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px",
            background: "var(--bg-glass)", borderRadius: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{i.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{i.value}</span>
          </div>
        ))}
      </div>

      {/* Change password */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showPwdSection ? 16 : 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={18} color="var(--accent-primary)" /> Ubah Password
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
                  <input type={showPwd ? "text" : "password"} className="input-field"
                    value={f.value} onChange={e => setPwd(p => ({ ...p, [f.key]: e.target.value }))} style={{ paddingRight: 40 }} />
                  <button onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
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
