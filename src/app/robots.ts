import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/search", "/watch/", "/watchlist", "/history"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
