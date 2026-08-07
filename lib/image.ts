// Prepares a photo for upload, entirely in the browser:
//   1. If it's an iPhone HEIC/HEIF, convert it to JPEG (browsers can't render
//      HEIC, so an un-converted one would upload but show as a broken image).
//   2. Downscale to a sensible size and re-compress as JPEG — a 4 MB phone photo
//      becomes a few hundred KB, so uploads and buyer page-loads stay fast.
// The heic2any library (which carries a WASM decoder) is imported lazily, only
// when a HEIC actually needs converting, so it never weighs down normal loads.

const MAX_DIMENSION = 1600; // longest side, in px
const JPEG_QUALITY = 0.82;

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export async function processImageForUpload(file: File): Promise<File> {
  // 1. HEIC → JPEG (only load the heavy decoder if we actually need it).
  let source: Blob = file;
  if (isHeic(file)) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });
    source = Array.isArray(converted) ? converted[0] : converted;
  }

  // 2. Downscale + compress on a canvas.
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("Couldn't encode the image");

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
