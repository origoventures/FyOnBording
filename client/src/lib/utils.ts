import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TagStatus } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to evaluate the title tag status
export function getTitleStatus(title: string | undefined): TagStatus {
  if (!title) return "error";
  if (title.length < 30 || title.length > 60) return "warning";
  return "good";
}

// Helper function to evaluate the description tag status
export function getDescriptionStatus(description: string | undefined): TagStatus {
  if (!description) return "error";
  if (description.length < 120 || description.length > 160) return "warning";
  return "good";
}

// Helper function to evaluate OG tags status
export function getOgTagsStatus(tags: Record<string, string>) {
  return {
    title: tags['og:title'] ? "good" : (tags.title ? "warning" : "error"),
    description: tags['og:description'] ? "good" : (tags.description ? "warning" : "error"),
    image: tags['og:image'] ? "good" : "error"
  };
}

// Helper function to evaluate Twitter card status
export function getTwitterCardStatus(tags: Record<string, string>) {
  return {
    card: tags['twitter:card'] ? "good" : "error",
    title: tags['twitter:title'] ? "good" : (tags['og:title'] ? "warning" : "error"),
    description: tags['twitter:description'] ? "good" : (tags['og:description'] ? "warning" : "error"),
    image: tags['twitter:image'] ? "good" : (tags['og:image'] ? "warning" : "error")
  };
}

// Get the status of an individual tag
export function getTagStatus(name: string, value: string | undefined): TagStatus {
  // Critical tags
  if (name === 'title') {
    if (!value) return 'error';
    if (value.length < 30 || value.length > 60) return 'warning';
    return 'good';
  }
  
  if (name === 'description') {
    if (!value) return 'error';
    if (value.length < 120 || value.length > 160) return 'warning';
    return 'good';
  }
  
  if (name === 'canonical') {
    return value ? 'good' : 'error';
  }
  
  // OG tags
  if (name === 'og:title' || name === 'og:description' || name === 'og:image' || name === 'og:type' || name === 'og:url') {
    return value ? 'good' : 'warning';
  }
  
  // Twitter tags
  if (name === 'twitter:card' || name === 'twitter:title' || name === 'twitter:description' || name === 'twitter:image') {
    return value ? 'good' : 'warning';
  }
  
  // Other important tags
  if (name === 'viewport' || name === 'robots' || name === 'charset' || name === 'content-language') {
    return value ? 'good' : 'warning';
  }
  
  // Default for other tags
  return value ? 'good' : 'error';
}

// Get text representation of tag status
export function getTagStatusText(status: TagStatus): string {
  switch (status) {
    case 'good': return 'Good';
    case 'warning': return 'Needs Improvement';
    case 'error': return 'Missing';
    default: return 'Unknown';
  }
}

// Get missing tags based on SEO best practices
export function getMissingTags(tags: Record<string, string>): { name: string, description: string }[] {
  const missingTags = [];
  
  // Check for critical missing tags
  if (!tags.title) {
    missingTags.push({
      name: 'title',
      description: 'The page title is essential for SEO and user experience.'
    });
  }
  
  if (!tags.description) {
    missingTags.push({
      name: 'description',
      description: 'A meta description helps search engines understand your page content.'
    });
  }
  
  if (!tags.canonical) {
    missingTags.push({
      name: 'canonical',
      description: 'Canonical tags prevent duplicate content issues.'
    });
  }
  
  // OG tags
  if (!tags['og:title']) {
    missingTags.push({
      name: 'og:title',
      description: 'Open Graph title improves social media sharing experience.'
    });
  }
  
  if (!tags['og:description']) {
    missingTags.push({
      name: 'og:description',
      description: 'Open Graph description improves social media sharing experience.'
    });
  }
  
  if (!tags['og:image']) {
    missingTags.push({
      name: 'og:image',
      description: 'Open Graph image increases engagement when shared on social media.'
    });
  }
  
  // Twitter tags
  if (!tags['twitter:card']) {
    missingTags.push({
      name: 'twitter:card',
      description: 'Twitter card type controls how your content appears on Twitter.'
    });
  }
  
  if (!tags['twitter:title'] && !tags['og:title']) {
    missingTags.push({
      name: 'twitter:title',
      description: 'Twitter title improves Twitter sharing experience.'
    });
  }
  
  if (!tags['twitter:image'] && !tags['og:image']) {
    missingTags.push({
      name: 'twitter:image',
      description: 'Twitter image increases engagement when shared on Twitter.'
    });
  }
  
  return missingTags;
}

// Get color class based on tag status
export function getStatusColorClass(status: TagStatus): string {
  switch (status) {
    case 'good': return 'bg-green-500 text-green-50';
    case 'warning': return 'bg-yellow-500 text-yellow-50';
    case 'error': return 'bg-red-500 text-red-50';
    default: return 'bg-gray-500 text-gray-50';
  }
}

// Format date for display
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}
