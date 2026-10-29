import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Diallo Coaching",
    short_name: "Diallo",
    description: "Coaching sportif et nutritionnel personnel.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#04070d",
    theme_color: "#04070d",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nutrition", url: "/nutrition" },
      { name: "Arène", url: "/arene" },
      { name: "Évolution", url: "/evolution" },
    ],
  };
}
