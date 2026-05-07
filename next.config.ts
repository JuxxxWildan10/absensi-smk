import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // next-pwa menggunakan webpack plugin, sehingga build harus menggunakan --webpack
  // Turbopack hanya digunakan di mode dev (via `next dev --webpack` untuk konsistensi)
};

module.exports = withPWA(nextConfig);
