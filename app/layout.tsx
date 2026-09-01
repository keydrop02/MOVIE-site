import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/constants";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { LibraryProvider } from "@/lib/storage/library-context";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    siteName: SITE.name,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LibraryProvider>
          <SiteNavbar />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LibraryProvider>
      </body>
    </html>
  );
}
