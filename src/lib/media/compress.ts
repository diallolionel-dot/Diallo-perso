import { MAX_IMAGE_DIMENSION } from "./image";

/**
 * Recompresse une photo dans le navigateur : redimensionnement, orientation
 * corrigée, export JPEG. Le fichier produit ne contient plus de métadonnées
 * EXIF (GPS, modèle d'appareil) et pèse en général moins de 500 Ko.
 */
export async function compressImage(file: File, maxDimension = MAX_IMAGE_DIMENSION, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponible");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Compression impossible");
    return new File([blob], "photo.jpg", { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
