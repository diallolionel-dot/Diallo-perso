/**
 * Règles communes aux photos (client et serveur).
 * Les photos sont recompressées en JPEG sur le téléphone avant l'envoi,
 * ce qui retire au passage les métadonnées EXIF (position GPS, appareil).
 */

export const MEDIA_KINDS = ["meals", "workouts", "progress", "weigh-ins"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** Taille maximale acceptée par le serveur après compression. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Dimension maximale (px) du plus grand côté après compression. */
export const MAX_IMAGE_DIMENSION = 1600;

const SIGNATURES: Array<{ type: ImageType; test: (b: Uint8Array) => boolean }> = [
  { type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/png",
    test: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v),
  },
  {
    type: "image/webp",
    test: (b) =>
      String.fromCharCode(b[0], b[1], b[2], b[3]) === "RIFF" && String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP",
  },
];

export type ImageType = "image/jpeg" | "image/png" | "image/webp";

export const IMAGE_EXTENSIONS: Record<ImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Détecte le format réel d'après la signature binaire (le type MIME déclaré ne suffit pas). */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length < 12) return null;
  return SIGNATURES.find((s) => s.test(bytes))?.type ?? null;
}

/** Chemin de stockage : toujours préfixé par l'identifiant de l'utilisateur (exigé par la RLS). */
export function buildMediaPath(userId: string, kind: MediaKind, type: ImageType, id: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw new RangeError("Identifiant invalide");
  }
  return `${userId}/${kind}/${id}.${IMAGE_EXTENSIONS[type]}`;
}

/** Vérifie qu'un chemin appartient bien à l'utilisateur. */
export function isOwnMediaPath(userId: string, path: string): boolean {
  return path.startsWith(`${userId}/`) && !path.includes("..");
}
