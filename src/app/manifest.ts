import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeuroDesk AI – Enterprise AI SaaS Platform",
    short_name: "NeuroDesk AI",
    description: "Enterprise Autonomous AI Intelligence Dashboard & Workspace",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#090d16",
    theme_color: "#3b82f6",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
