"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker en production uniquement.
 * En développement, un service worker mettrait en cache des fichiers
 * périmés et gênerait le rechargement à chaud.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // L'application reste pleinement utilisable sans service worker.
    });
  }, []);

  return null;
}
