import { MetadataRoute } from "next"

import { siteConfig } from "./siteConfig"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: "KretyaApp",
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/icons/icon-dark-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-dark-512.png", sizes: "512x512", type: "image/png" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  }
}
