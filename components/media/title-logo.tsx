import Image from "next/image";
import { getTmdbImage } from "@/lib/tmdb/images";
import type { TitleLogoInfo } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

interface TitleLogoProps {
  /** Chosen logo (path + aspect ratio) when available. */
  logo?: TitleLogoInfo | null;
  /** Raw logo file_path (used when only a path is known). */
  logoPath?: string | null;
  /** Aspect ratio (width/height); used to normalize visual size. */
  ratio?: number;
  title: string;
  className?: string;
  imageClassName?: string;
  /** Max display height on desktop (sm+); narrower logos may exceed this. */
  height?: number;
  /**
   * Dynamic mobile height: a clamp() of min/preferred/max so the logo
   * scales smoothly with viewport width on small screens.
   */
  mobileHeight?: string;
  /**
   * Target visual width (px) used to normalize size — logos are scaled so
   * they reach roughly this width, giving a consistent footprint regardless
   * of each artwork's intrinsic aspect ratio.
   */
  targetWidth?: number;
  /**
   * Max width of the rendered logo in px/rem. Wide wordmarks are capped so
   * they never overflow the container, shrinking proportionally instead.
   */
  maxWidth?: number | string;
}

/**
 * Renders a title wordmark logo when one is available, falling back to the
 * plain styled title text (kept as sr-only when a logo is shown). Logos are
 * normalized by target width so all titles read at a similar visual size
 * even when the source wordmarks have very different aspect ratios.
 */
export function TitleLogo({
  logo,
  logoPath,
  ratio,
  title,
  className,
  imageClassName,
  height = 120,
  mobileHeight = "clamp(40px, 11vw, 60px)",
  targetWidth = 380,
  maxWidth = 480,
}: TitleLogoProps) {
  const path = logo?.path ?? logoPath;
  const src = getTmdbImage(path, "logo", "w500");

  if (!src) {
    return (
      <h1 className={cn("text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl", className)}>
        {title}
      </h1>
    );
  }

  const aspectRatio = logo?.ratio ?? ratio ?? 3;
  const deducedHeight = Math.max(height, Math.round(targetWidth / aspectRatio));
  const maxWidthStyle =
    typeof maxWidth === "number" ? `min(${maxWidth}px, 100%)` : maxWidth;

  return (
    <div className={cn("flex items-center", className)}>
      <h1 className="sr-only">{title}</h1>
      <Image
        src={src}
        alt={title}
        width={1200}
        height={384}
        sizes="50vw"
        className={cn("title-logo-img h-auto w-auto max-w-full object-contain object-left", imageClassName)}
        style={{ width: "auto", maxWidth: maxWidthStyle, aspectRatio: `${aspectRatio}` }}
      />
      <style>{`
        .title-logo-img { height: ${mobileHeight} !important; }
        @media (min-width: 640px) { .title-logo-img { height: ${deducedHeight}px !important; } }
      `}</style>
    </div>
  );
}
