import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  srcSet?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  aspectRatio?: "auto" | "square" | "video" | "portrait" | "custom";
  customRatio?: string; // e.g. "16/9", "4/3", etc.
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  loading?: "lazy" | "eager";
  sizes?: string;
  preload?: boolean;
}

export function ResponsiveImage({
  src,
  alt,
  srcSet,
  aspectRatio = "auto",
  customRatio,
  objectFit = "cover",
  className,
  loading = "lazy",
  sizes = "(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw",
  preload = false,
  ...props
}: ResponsiveImageProps) {
  // Define aspect ratio classes
  const aspectRatioClasses = {
    auto: "",
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    custom: customRatio ? `aspect-[${customRatio}]` : "",
  };

  // Define object fit classes
  const objectFitClasses = {
    contain: "object-contain",
    cover: "object-cover",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
  };

  // Set explicit height if preload is enabled to prevent CLS
  const preloadStyle = preload
    ? { height: "auto", display: "block" }
    : {};

  return (
    <>
      {preload && (
        <link
          rel="preload"
          as="image"
          href={src}
          imagesizes={sizes}
          fetchpriority="high"
        />
      )}
      
      <picture className={cn("block", aspectRatioClasses[aspectRatio], className)}>
        {srcSet?.mobile && (
          <source media="(max-width: 480px)" srcSet={srcSet.mobile} />
        )}
        {srcSet?.tablet && (
          <source media="(max-width: 768px)" srcSet={srcSet.tablet} />
        )}
        {srcSet?.desktop && <source srcSet={srcSet.desktop} />}
        
        <img
          src={src}
          alt={alt}
          loading={loading}
          className={cn("w-full h-full", objectFitClasses[objectFit])}
          style={preloadStyle}
          sizes={sizes}
          {...props}
        />
      </picture>
    </>
  );
}