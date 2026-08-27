"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong bg-card/70 px-5 text-sm font-semibold text-foreground backdrop-blur transition hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      {copied ? (
        <>
          <Check className="size-4" aria-hidden />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="size-4" aria-hidden />
          Share
        </>
      )}
    </button>
  );
}
