import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

/**
 * Standard page section with vertical rhythm. Use the container for
 * the floating-content wrapper, and outer spacing for section breaks.
 */
export function Section({ children, className, containerClassName }: SectionProps) {
  return (
    <section className={cn("py-5 sm:py-6", className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
