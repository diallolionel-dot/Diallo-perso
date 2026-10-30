import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  MAX_UPLOAD_BYTES,
  MEDIA_KINDS,
  buildMediaPath,
  detectImageType,
  isOwnMediaPath,
  type MediaKind,
} from "@/lib/media/image";
import { PRIVATE_MEDIA_BUCKET, SIGNED_URL_TTL_SECONDS } from "./server";

type Client = SupabaseClient<Database>;

export type UploadResult = { ok: true; path: string } | { ok: false; message: string };

/** Lit le champ fichier d'un formulaire ; `null` si aucun fichier n'a été choisi. */
export function fileFromForm(formData: FormData, field = "photo"): File | null {
  const value = formData.get(field);
  return value instanceof File && value.size > 0 ? value : null;
}

/**
 * Vérifie puis envoie une photo dans le bucket privé, sous `{userId}/{kind}/`.
 * Le format est contrôlé sur les octets réels, pas sur le type déclaré.
 */
export async function uploadPrivateImage(
  supabase: Client,
  userId: string,
  kind: MediaKind,
  file: File,
): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "Photo trop lourde (5 Mo maximum)." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) {
    return { ok: false, message: "Format non reconnu : JPEG, PNG ou WebP uniquement." };
  }

  const path = buildMediaPath(userId, kind, type, crypto.randomUUID());
  const { error } = await supabase.storage
    .from(PRIVATE_MEDIA_BUCKET)
    .upload(path, bytes, { contentType: type, upsert: false, cacheControl: "private, max-age=600" });

  if (error) return { ok: false, message: "L'envoi de la photo a échoué. Réessaie." };
  return { ok: true, path };
}

/** URLs signées (10 min) pour afficher des photos privées. Les chemins étrangers sont ignorés. */
export async function signedUrlsFor(
  supabase: Client,
  userId: string,
  paths: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const own = [...new Set(paths.filter((p): p is string => !!p && isOwnMediaPath(userId, p)))];
  const urls = new Map<string, string>();
  if (own.length === 0) return urls;

  const { data } = await supabase.storage.from(PRIVATE_MEDIA_BUCKET).createSignedUrls(own, SIGNED_URL_TTL_SECONDS);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

export async function removePrivateImages(supabase: Client, userId: string, paths: Array<string | null | undefined>) {
  const own = paths.filter((p): p is string => !!p && isOwnMediaPath(userId, p));
  if (own.length > 0) await supabase.storage.from(PRIVATE_MEDIA_BUCKET).remove(own);
}

/** Supprime toutes les photos de l'utilisateur (avant effacement des données ou du compte). */
export async function removeAllPrivateImages(supabase: Client, userId: string): Promise<void> {
  for (const kind of MEDIA_KINDS) {
    const folder = `${userId}/${kind}`;
    for (;;) {
      const { data, error } = await supabase.storage.from(PRIVATE_MEDIA_BUCKET).list(folder, { limit: 100 });
      if (error) throw new Error("Impossible de lister les photos à supprimer.");
      if (!data || data.length === 0) break;
      const { error: removeError } = await supabase.storage
        .from(PRIVATE_MEDIA_BUCKET)
        .remove(data.map((f) => `${folder}/${f.name}`));
      if (removeError) throw new Error("Impossible de supprimer les photos.");
      if (data.length < 100) break;
    }
  }
}
