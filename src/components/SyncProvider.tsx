"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const hydrateFromDB = useStore((state) => state.hydrateFromDB);

  useEffect(() => {
    // Jalankan pertama kali saat aplikasi dimuat
    hydrateFromDB();

    // Polling setiap 15 detik untuk sinkronisasi state antar device
    const interval = setInterval(() => {
      hydrateFromDB();
    }, 15000);

    return () => clearInterval(interval);
  }, [hydrateFromDB]);

  return <>{children}</>;
}
