// ============================================================
// AbsensiCerdas - Geofencing Utility
// ============================================================

export interface GeoResult {
  isInside: boolean;
  distance: number; // meters
  latitude: number;
  longitude: number;
  accuracy: number;
  isMocked: boolean;
}

/**
 * Haversine formula to calculate distance between two GPS points
 * 
 * Rumus matematika (Haversine) untuk menghitung jarak akurat antara dua titik koordinat bumi (latitude & longitude).
 * Menghasilkan perhitungan jarak linier dalam satuan meter.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * Get current user position via HTML5 Geolocation API
 * 
 * Mengambil lokasi titik koordinat GPS perangkat pengguna saat ini melalui browser API.
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolokasi tidak didukung di browser ini"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

/**
 * Validate if a position is within school geofence
 * 
 * Fungsi utama untuk memvalidasi apakah pengguna (siswa) sedang berada di dalam area radius sekolah (Geofence).
 * Jika distance (jarak) <= radiusMeters, maka isInside = true.
 */
export async function validateGeofence(
  schoolLat: number,
  schoolLon: number,
  radiusMeters: number
): Promise<GeoResult> {
  const position = await getCurrentPosition();
  const { latitude, longitude, accuracy } = position.coords;

  // Simple heuristic for Mock Location (Fake GPS) detection
  let isMocked = false;
  // Common traits of fake GPS:
  // 1. Accuracy is exactly 150 or exactly 100
  // 2. Or the latitude/longitude have very few decimal places compared to real GPS
  if (accuracy === 150 || accuracy === 100) {
    isMocked = true;
  }

  const distance = haversineDistance(latitude, longitude, schoolLat, schoolLon);
  const isInside = distance <= radiusMeters;

  return { isInside, distance: Math.round(distance), latitude, longitude, accuracy, isMocked };
}

/**
 * Format distance in human-readable form
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} meter`;
  return `${(meters / 1000).toFixed(1)} km`;
}
