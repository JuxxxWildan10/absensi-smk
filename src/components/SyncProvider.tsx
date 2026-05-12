"use client";

// SyncProvider: wrapper transparan untuk children.
// Polling data dari DB ditangani di dashboard/layout.tsx (setInterval 15 detik)
// agar tidak ada polling ganda yang memboroskan koneksi.
export default function SyncProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
