import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/** Large centered max-width container (~1440px) with responsive padding. */
export function Container({ children, className, as: Tag = "div" }: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full max-w-[1440px] px-5 md:px-10", className)}>
      {children}
    </Tag>
  );
}
