import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${siteConfig.url}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/movies`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/tv`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/trending`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${siteConfig.url}/anime`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteConfig.url}/calendar`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];
}
