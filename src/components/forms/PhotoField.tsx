"use client";

import { Camera, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { compressImage } from "@/lib/media/compress";
import { useField } from "./ActionForm";

interface PhotoFieldProps {
  name?: string;
  label: string;
  hint?: string;
}

/**
 * Sélection d'une photo (appareil ou galerie). L'image est recompressée dans
 * le navigateur avant l'envoi : plus légère, et sans métadonnées EXIF (GPS).
 */
export function PhotoField({ name = "photo", label, hint }: PhotoFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { error } = useField(name);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "working" | "failed">("idle");

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const original = input.files?.[0];
    if (!original) return;
    setStatus("working");
    try {
      const compressed = await compressImage(original);
      const transfer = new DataTransfer();
      transfer.items.add(compressed);
      input.files = transfer.files;
      setPreview(URL.createObjectURL(compressed));
      setStatus("idle");
    } catch {
      input.value = "";
      setPreview(null);
      setStatus("failed");
    }
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
    setStatus("idle");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="flex items-center gap-3">
        <label
          htmlFor={id}
          className="relative grid size-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-night-900 text-ink-muted hover:border-teal-500/60"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:), aucune optimisation utile
            <img src={preview} alt="Aperçu de la photo choisie" className="absolute inset-0 size-full object-cover" />
          ) : status === "working" ? (
            <Loader2 aria-hidden className="size-5 animate-spin" />
          ) : (
            <Camera aria-hidden className="size-6" />
          )}
        </label>
        <div className="min-w-0 flex-1 text-xs leading-relaxed text-ink-muted">
          {status === "working"
            ? "Compression…"
            : status === "failed"
              ? "Ce format n'a pas pu être lu. Essaie une photo JPEG."
              : preview
                ? "Photo prête, compressée sans données GPS."
                : (hint ?? "Facultatif. Appareil photo ou galerie.")}
          {preview ? (
            <button type="button" onClick={clear} className="mt-1 flex items-center gap-1 font-semibold text-ink-soft">
              <X aria-hidden className="size-3.5" /> Retirer
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="sr-only"
          aria-invalid={error ? true : undefined}
        />
      </div>
      {error ? <p className="text-xs font-medium text-ember-400">{error}</p> : null}
    </div>
  );
}
