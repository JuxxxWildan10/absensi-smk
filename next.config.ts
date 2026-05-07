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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Abaikan modul Node.js (fs, encoding) di sisi client agar face-api.js bisa di-build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false,
      };
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
