// ============================================================
// AbsensiCerdas - Face Recognition Utility (face-api.js)
// ============================================================
"use client";

// Models are loaded from public/models directory
const MODEL_URL = "/models";

let modelsLoaded = false;

// Fungsi utama untuk memuat model AI (pendeteksi wajah) dari direktori lokal (/models)
// Harus dipanggil sekali sebelum melakukan pemindaian wajah
export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;

  // Dynamically import face-api.js (client-only)
  const faceapi = await import("face-api.js");

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
}

// Fungsi untuk mendeteksi wajah tunggal dari frame video kamera
// Mengembalikan data Float32Array (deskriptor wajah) yang unik untuk setiap orang
export async function detectFaceDescriptor(
  video: HTMLVideoElement
): Promise<Float32Array | null> {
  const faceapi = await import("face-api.js");

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor;
}

export async function detectFaceWithExpression(
  video: HTMLVideoElement
): Promise<{
  descriptor: Float32Array | null;
  expression: string | null;
  eyeBlink: boolean;
}> {
  const faceapi = await import("face-api.js");

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
    .withFaceExpressions();

  if (!detection) {
    return { descriptor: null, expression: null, eyeBlink: false };
  }

  // Check for eye blink via landmark distance (EAR - Eye Aspect Ratio)
  const landmarks = detection.landmarks;
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();

  const eyeBlink = isEyeBlinking(leftEye) || isEyeBlinking(rightEye);

  // Get dominant expression
  const expressions = detection.expressions;
  const dominantExpression = Object.entries(expressions).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  )[0]?.[0] ?? null;

  return {
    descriptor: detection.descriptor,
    expression: dominantExpression,
    eyeBlink,
  };
}

/**
 * Eye Aspect Ratio (EAR) to detect blink
 * EAR < 0.25 typically means eyes are closed
 */
function isEyeBlinking(
  eyeLandmarks: { x: number; y: number }[]
): boolean {
  if (eyeLandmarks.length < 6) return false;
  const vertical1 = euclideanDist(eyeLandmarks[1], eyeLandmarks[5]);
  const vertical2 = euclideanDist(eyeLandmarks[2], eyeLandmarks[4]);
  const horizontal = euclideanDist(eyeLandmarks[0], eyeLandmarks[3]);
  const ear = (vertical1 + vertical2) / (2.0 * horizontal);
  return ear < 0.25;
}

function euclideanDist(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Compare two face descriptors using Euclidean distance
 * threshold < 0.6 = same person (face-api.js standard)
 * 
 * Fungsi inti untuk membandingkan kecocokan dua wajah.
 * Menghitung jarak (distance) Euclidean. Jika di bawah threshold (0.6), wajah dianggap sama.
 */
export function compareFaceDescriptors(
  desc1: Float32Array | number[],
  desc2: Float32Array | number[],
  threshold = 0.6
): { match: boolean; distance: number } {
  const d1 = new Float32Array(desc1);
  const d2 = new Float32Array(desc2);

  let sum = 0;
  for (let i = 0; i < d1.length; i++) {
    const diff = d1[i] - d2[i];
    sum += diff * diff;
  }
  const distance = Math.sqrt(sum);
  return { match: distance < threshold, distance: parseFloat(distance.toFixed(4)) };
}

/**
 * Capture a snapshot from video element as base64 image
 */
export function captureSnapshot(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.8);
}

/**
 * Draw face detection results on canvas overlay
 */
export async function drawFaceDetection(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<boolean> {
  const faceapi = await import("face-api.js");

  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  const resized = faceapi.resizeResults(detections, displaySize);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);
  }

  return detections.length > 0;
}
