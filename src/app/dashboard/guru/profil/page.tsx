"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { User, Mail, Phone, Save, Lock, Eye, EyeOff, Shield } from "lucide-react";
import Toast, { ToastType } from "@/components/Toast";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator", guru: "Guru / Tenaga Pengajar", siswa: "Siswa", wali: "Wali Murid",
};

export default function ProfilPage() {
  const { currentUser, updateProfile } = useStore();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    phone: currentUser?.phone ?? "",
  });
  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });

  if (!currentUser) return null;

  const handleSaveProfile = () => {
    if (!form.name.trim()) {
      setToast({ message: "Nama tidak boleh kosong", type: "error" });
      return;
    }
    updateProfile({ name: form.name, phone: form.phone });
    setToast({ message: "Profil berhasil diperbarui!", type: "success" });
  };

  const handleChangePassword = () => {
    if (pwd.current !== "password123") {
      setToast({ message: "Password saat ini tidak sesuai", type: "error" });
      return;
    }
    if (pwd.newPwd.length < 8) {
      setToast({ message: "Password baru minimal 8 karakter", type: "error" });
      return;
    }
    if (pwd.newPwd !== pwd.confirm) {
      setToast({ message: "Konfirmasi password tidak sesuai", type: "error" });
      return;
    }
    setPwd({ current: "", newPwd: "", confirm: "" });
    setShowPasswordSection(false);
    setToast({ message: "Password berhasil diubah!", type: "success" });
  };

  const roleInfo = (() => {
    const r = currentUser.role;
    if (r === "guru") {
      const g = currentUser as import("@/lib/types").Teacher;
      return [
        { label: "NIP", value: g.nip },
        { label: "Kelas Wali", value: g.kelasWali || "–" },
        { label: "Mata Pelajaran", value: g.mataPelajaran?.join(", ") || "–" },
      ];
    }
    if (r === "siswa") {
      const s = currentUser as import("@/lib/types").Student;
      return [
        { label: "NISN", value: s.nisn },
        { label: "Kelas", value: s.kelas },
        { label: "Jurusan", value: s.jurusan },
      ];
    }
    if (r === "wali") {
      const w = currentUser as import("@/lib/types").Parent;
      return [{ label: "No. WhatsApp", value: w.waNumber || "–" }];
    }
    return [];
  })();

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 680 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Profil Saya</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Kelola informasi akun dan keamanan Anda.</p>
      </div>

      {/* Avatar card */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20, background: "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--gradient-primary)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "white", flexShrink: 0 }}>
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{currentUser.name}</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>{currentUser.username}</div>
            <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "var(--gradient-primary)", color: "white", fontWeight: 600 }}>
              {ROLE_LABEL[currentUser.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <User size={18} color="var(--accent-primary)" /> Informasi Pribadi
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Nama Lengkap</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Email (tidak dapat diubah)</label>
            <input className="input-field" value={currentUser.username} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Nomor HP / WhatsApp</label>
            <input className="input-field" value={form.phone} placeholder="08xxxxxxxxxx"
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn-primary" onClick={handleSaveProfile} id="btn-simpan-profil">
              <Save size={16} /> Simpan Perubahan
            </button>
          </div>
        </div>
      </div>

      {/* Role-specific info */}
      {roleInfo.length > 0 && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={18} color="var(--accent-primary)" /> Informasi Akademik
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {roleInfo.map(info => (
              <div key={info.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: "var(--bg-glass)", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{info.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{info.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", background: "var(--bg-glass)", borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Bergabung Sejak</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {new Date(currentUser.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", background: "var(--bg-glass)", borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Status Akun</span>
              <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 12,
                background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 600 }}>
                {currentUser.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Change password */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showPasswordSection ? 20 : 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={18} color="var(--accent-primary)" /> Ubah Password
          </div>
          <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }}>
            {showPasswordSection ? "Batal" : "Ubah Password"}
          </button>
        </div>
        {showPasswordSection && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Password Saat Ini", value: pwd.current, key: "current", show: showCurrentPwd, toggle: () => setShowCurrentPwd(!showCurrentPwd) },
              { label: "Password Baru (min. 8 karakter)", value: pwd.newPwd, key: "newPwd", show: showNewPwd, toggle: () => setShowNewPwd(!showNewPwd) },
              { label: "Konfirmasi Password Baru", value: pwd.confirm, key: "confirm", show: showNewPwd, toggle: () => setShowNewPwd(!showNewPwd) },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <input type={f.show ? "text" : "password"} className="input-field"
                    value={f.value} onChange={e => setPwd(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ paddingRight: 40 }} />
                  <button onClick={f.toggle} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    {f.show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-primary" onClick={handleChangePassword} id="btn-ganti-password">
                <Lock size={16} /> Ganti Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
