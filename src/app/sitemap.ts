import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://neurodesk-ai.vercel.app";

  const routes = [
    "",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/dashboard",
    "/dashboard/ai-assistant",
    "/dashboard/analytics",
    "/dashboard/calendar",
    "/dashboard/files",
    "/dashboard/notifications",
    "/dashboard/settings",
    "/dashboard/team",
    "/dashboard/workspace",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.startsWith("/dashboard") ? "daily" : "monthly",
    priority: route === "" ? 1.0 : route.startsWith("/dashboard") ? 0.8 : 0.5,
  }));
}
