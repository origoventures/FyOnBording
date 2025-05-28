import React from "react";
import { cn } from "@/lib/utils";

interface ScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: "horizontal" | "vertical";
  snapType?: "none" | "mandatory" | "proximity";
  snapAlign?: "start" | "center" | "end";
  hideScrollbar?: boolean;
  className?: string;
}

export function ScrollContainer({
  children,
  direction = "horizontal",
  snapType = "mandatory",
  snapAlign = "start",
  hideScrollbar = false,
  className,
  ...props
}: ScrollContainerProps) {
  const scrollDirection = direction === "horizontal" ? "overflow-x-auto" : "overflow-y-auto";
  
  const snapClasses = snapType !== "none" 
    ? `scroll-snap-type-${direction} scroll-snap-${snapType} children:scroll-snap-align-${snapAlign}` 
    : "";
  
  const hideScrollbarClass = hideScrollbar 
    ? "scrollbar-hide" 
    : "";

  // For horizontal scrolling, add touch-action manipulation for better mobile interaction
  const touchActionClass = direction === "horizontal" 
    ? "touch-action-pan-x" 
    : "";

  // Apply scroll padding for better UX
  const scrollPaddingClass = direction === "horizontal" 
    ? "scroll-px-4 sm:scroll-px-6" 
    : "scroll-py-4 sm:scroll-py-6";

  return (
    <div
      className={cn(
        scrollDirection,
        snapClasses,
        hideScrollbarClass,
        touchActionClass,
        scrollPaddingClass,
        "w-full",
        className
      )}
      style={{
        scrollSnapType: snapType !== "none" ? `${direction} ${snapType}` : "none",
        touchAction: direction === "horizontal" ? "pan-x" : "auto",
      }}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            className: cn(
              child.props.className,
              `scroll-snap-align-${snapAlign}`
            ),
            style: {
              ...child.props.style,
              scrollSnapAlign: snapAlign,
            },
          });
        }
        return child;
      })}
    </div>
  );
}