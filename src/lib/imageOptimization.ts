import imageCompression, { type Options } from "browser-image-compression";

export type ImagePurpose = "avatar" | "goal" | "journal" | "thumbnail";

const PRESETS: Record<ImagePurpose, Options> = {
  avatar: {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 400,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.85,
  },
  goal: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.85,
  },
  journal: {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.88,
  },
  thumbnail: {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 200,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.8,
  },
};

/**
 * Compresses and converts an image to WebP before upload.
 * Falls back to original file on error (degraded mode).
 */
export async function optimizeImage(file: File, purpose: ImagePurpose): Promise<File> {
  // GIFs are intentionally skipped — compression would strip animation.
  if (file.type === "image/gif") return file;
  // Already-optimized small WebP: pass through.
  if (file.type === "image/webp" && file.size <= 150 * 1024) return file;
  try {
    const compressed = await imageCompression(file, PRESETS[purpose]);
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([compressed], `${baseName}.webp`, { type: "image/webp" });
  } catch (e) {
    console.warn("[imageOptimization] Compression failed, falling back to original:", e);
    return file;
  }
}