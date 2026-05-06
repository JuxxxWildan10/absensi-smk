"use client";
import { useStore } from "@/lib/store";
import { MapPin, Clock, Save, Moon, Sun, Shield } from "lucide-react";
import Toast, { ToastType } from "@/components/Toast";
import { useState, useEffect } from "react";

interface ToastState { message: string; type: ToastType }

export default function AdminSettingsPage() {
  const { schoolConfig, updateSchoolConfig } = useStore();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [form, setForm] = useState({
    name: schoolConfig.name,
    address: schoolConfig.address,
    latitude: schoolConfig.latitude,
    longitude: schoolConfig.longitude,
    radius: schoolConfig.radius,
    checkInStart: schoolConfig.checkInStart,
    checkInEnd: schoolConfig.checkInEnd,
    checkOutStart: schoolConfig.checkOutStart,
    checkOutEnd: schoolConfig.checkOutEnd,
  });

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved !== "light";
    setIsDarkMode(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newDark = !isDarkMode;
    setIsDarkMode(newDark);
    document.documentElement.setAttribute("data-theme", newDark ? "dark" : "light");
    localStorage.setItem("theme", newDark ? "dark" : "light");
    setToast({ message: `Mode ${newDark ? "gelap" : "terang"} diaktifkan`, type: "info" });
  };

  const handleSave = () => {
    updateSchoolConfig(form);
    setToast({ message: "Pengaturan berhasil disimpan!", type: "success" });
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 720 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Pengaturan Sistem</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Konfigurasi parameter operasional sistem absensi cerdas.
        </p>
      </div>

      {/* Theme Toggle */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          {isDarkMode ? <Moon size={18} color="var(--accent-primary)" /> : <Sun size={18} color="#f59e0b" />}
          Tampilan
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Mode Tampilan</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {isDarkMode ? "Mode gelap aktif" : "Mode terang aktif"}
            </div>
          </div>
          <button onClick={toggleTheme} id="btn-toggle-theme"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
              background: isDarkMode ? "rgba(99,102,241,0.15)" : "rgba(245,158,11,0.15)",
              border: `1px solid ${isDarkMode ? "rgba(99,102,241,0.3)" : "rgba(245,158,11,0.3)"}`,
              borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 14,
              color: isDarkMode ? "#6366f1" : "#f59e0b", transition: "all 0.2s" }}>
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            {isDarkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
          </button>
        </div>
      </div>

      {/* School info */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={18} color="var(--accent-primary)" /> Informasi Sekolah
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Nama Sekolah</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Alamat</label>
            <textarea className="input-field" rows={2} value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={{ resize: "none" }} />
          </div>
        </div>
      </div>

      {/* Geofencing */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={18} color="var(--accent-primary)" /> Konfigurasi Geofencing
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Latitude</label>
            <input className="input-field" type="number" step="any" value={form.latitude}
              onChange={e => setForm(f => ({ ...f, latitude: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>Longitude</label>
            <input className="input-field" type="number" step="any" value={form.longitude}
              onChange={e => setForm(f => ({ ...f, longitude: Number(e.target.value) }))} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>
            Radius Toleransi (meter) — saat ini: {form.radius}m
          </label>
          <input className="input-field" type="number" value={form.radius}
            onChange={e => setForm(f => ({ ...f, radius: Number(e.target.value) }))} />
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", padding: "10px 12px", background: "rgba(59,130,246,0.06)", borderRadius: 8 }}>
          💡 Koordinat digunakan untuk memvalidasi lokasi absensi siswa. Pastikan koordinat akurat sesuai lokasi sekolah.
        </div>
      </div>

      {/* Jadwal */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={18} color="var(--accent-primary)" /> Jadwal Operasional
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "Mulai Check-in", key: "checkInStart" },
            { label: "Batas Check-in (Batas Tepat Waktu)", key: "checkInEnd" },
            { label: "Mulai Check-out", key: "checkOutStart" },
            { label: "Batas Check-out", key: "checkOutEnd" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--text-secondary)" }}>{f.label}</label>
              <input className="input-field" type="time" value={form[f.key as keyof typeof form] as string}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ colorScheme: "dark" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} className="btn-primary" style={{ padding: "12px 28px" }} id="btn-simpan-pengaturan">
          <Save size={16} /> Simpan Semua Pengaturan
        </button>
      </div>
    </div>
  );
}
