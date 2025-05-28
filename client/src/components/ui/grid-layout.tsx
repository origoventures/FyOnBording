import React from "react";
import { cn } from "@/lib/utils";

interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  autoFit?: boolean;
  minWidth?: string;
}

export function GridLayout({
  children,
  className,
  columns = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = "md",
  autoFit = false,
  minWidth = "250px",
  ...props
}: GridLayoutProps) {
  // Define gap classes
  const gapClasses = {
    none: "gap-0",
    xs: "gap-2",
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
    xl: "gap-10",
  };

  // If autoFit is true, create a responsive grid with auto-fit
  const autoFitClass = autoFit
    ? `grid-cols-[repeat(auto-fit,minmax(${minWidth},1fr))]`
    : "";

  // Create column classes based on breakpoints
  const columnClasses = !autoFit
    ? [
        columns.xs && `grid-cols-${columns.xs}`,
        columns.sm && `sm:grid-cols-${columns.sm}`,
        columns.md && `md:grid-cols-${columns.md}`,
        columns.lg && `lg:grid-cols-${columns.lg}`,
        columns.xl && `xl:grid-cols-${columns.xl}`,
      ].filter(Boolean).join(" ")
    : "";

  return (
    <div
      className={cn(
        "grid w-full",
        gapClasses[gap],
        autoFitClass,
        columnClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}