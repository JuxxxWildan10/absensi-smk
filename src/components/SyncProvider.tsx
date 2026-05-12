"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import useSWR from "swr";

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const hydrateFromDB = useStore((state) => state.hydrateFromDB);

  // Gunakan SWR untuk polling lebih cerdas (Berhenti otomatis saat tab tidak aktif)
  useSWR("sync-db", hydrateFromDB, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  return <>{children}</>;
}
