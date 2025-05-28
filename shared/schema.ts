import { pgTable, text, serial, integer, boolean, jsonb, timestamp, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Plan type enum
export const planTypeEnum = pgEnum('plan_type', ['free', 'basic', 'premium', 'enterprise']);

// Plans table - stores subscription plan details
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  type: planTypeEnum("type").notNull(),
  price: integer("price").notNull(), // Price in cents
  monthlyLimit: integer("monthly_limit").notNull(), // Number of SEO analyses allowed per month
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define auth provider enum
export const authProviderEnum = pgEnum('auth_provider', ['email', 'google', 'facebook', 'github', 'twitter', 'apple']);

// Users table - stores user information with subscription details
export const users = pgTable("users", {
  id: varchar("id", { length: 100 }).primaryKey(), // Firebase UID as string
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  firebaseUid: varchar("firebase_uid", { length: 100 }),
  authProvider: authProviderEnum("auth_provider").default('email'),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  currentPlan: varchar("current_plan", { length: 20 }).default('free'),
  monthlyUsage: integer("monthly_usage").default(0),
  lastResetDate: timestamp("last_reset_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define the SEO analysis schema with user association
export const seoAnalyses = pgTable("seo_analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).references(() => users.id),
  url: text("url").notNull(),
  tags: jsonb("tags").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table - stores payment history
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).references(() => users.id),
  stripeSessionId: varchar("stripe_session_id", { length: 100 }),
  amount: integer("amount").notNull(),
  planType: planTypeEnum("plan_type").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define the insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  lastResetDate: true,
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeoAnalysisSchema = createInsertSchema(seoAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plans.$inferSelect;

export type InsertSeoAnalysis = z.infer<typeof insertSeoAnalysisSchema>;
export type SeoAnalysis = typeof seoAnalyses.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Meta tag status types
export type TagStatus = "good" | "warning" | "error";

// TagCount for summary
export interface TagCounts {
  good: number;
  warning: number;
  error: number;
}

// Keyword intent classification
export type KeywordIntent = 'informational' | 'navigational' | 'transactional';

// Keyword analysis data structure
export interface KeywordData {
  keyword: string;
  frequency: number;
  tfidf: number;
  intent: KeywordIntent;
}

// Related keyword suggestion
export interface KeywordSuggestion {
  keyword: string;
  relevance: number;
  intent: KeywordIntent;
}

// Keyword analysis result
export interface KeywordAnalysis {
  topKeywords: KeywordData[];
  suggestions: KeywordSuggestion[];
  contentLength: number;
}

// Search Console performance metrics
export interface SearchConsoleMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  startDate: string;
  endDate: string;
}

// Google Analytics metrics
export interface GA4Metrics {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  startDate: string;
  endDate: string;
}

// Performance comparison data
export interface PerformanceComparison {
  ctrDifference: number;
  positionDifference: number;
  impressionsDifference: number;
}

// Communication clarity analysis
export interface ClarityAnalysis {
  perceivedPurpose: {
    description: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    keyTerms: string[];
  };
  clarityAssessment: {
    score: number; // 1-10
    strengths: string[];
    weaknesses: string[];
    overallVerdict: string;
  };
  improvementSuggestions: {
    copywriting: string[];
    structure: string[];
    emphasis: string[];
    priority: 'high' | 'medium' | 'low';
  };
}

// SEO data structure
export interface SeoData {
  tags: Record<string, string>;
  score: number;
  tagCounts: TagCounts;
  webVitals?: CoreWebVitalsData;
  url?: string;
  keywordAnalysis?: KeywordAnalysis;
  searchConsole?: SearchConsoleMetrics;
  analytics?: GA4Metrics;
  performanceComparison?: PerformanceComparison;
  clarityAnalysis?: ClarityAnalysis;
}

// Comparison data structure
export interface ComparisonData {
  primary: SeoData;
  competitors: SeoData[];
  categories: ComparisonCategory[];
}

export interface ComparisonCategory {
  name: string;
  key: string;
  description: string;
  leader: number; // Index of the website with the best score (0 = primary, 1-3 = competitors)
  scores: number[];
}

// SEO tag status - helper object for UI evaluation
export interface SeoTagStatus {
  title: TagStatus;
  description: TagStatus;
  ogTags: {
    title: TagStatus;
    description: TagStatus;
    image: TagStatus;
  };
  twitterTags: {
    card: TagStatus;
    title: TagStatus;
    description: TagStatus;
    image: TagStatus;
  };
}

// Missing tag information
export interface MissingTag {
  name: string;
  description: string;
}

export type MetricStatus = 'good' | 'needs-improvement' | 'poor';

export interface CoreWebVitalsMetric {
  name: string;
  value: number;
  status: MetricStatus;
  description: string;
  improvementTips: string[];
}

export interface CoreWebVitalsData {
  lcp: CoreWebVitalsMetric;
  fid: CoreWebVitalsMetric;
  cls: CoreWebVitalsMetric;
  url: string;
  fetchTime: string;
}

export type ImageFlag = 'OVERSIZE' | 'MISSING_ALT' | 'NOT_WEBP';

export interface ImageData {
  src: string;
  width: number;
  height: number;
  sizeKB: number;
  format: string;
  alt: string | null;
  flags: ImageFlag[];
  optimizedSrc?: string;
  optimizedSizeKB?: number;
  savingsKB?: number;
  savingsPercent?: number;
}

export interface ImageAuditResult {
  images: ImageData[];
  totalOriginalSize: number;
  url?: string;
  path?: string;
}

export interface ImageConversionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completed: number;
  total: number;
  results: ImageData[];
  error?: string;
}
