import OpenAI from "openai";
import { CheerioAPI, load } from "cheerio";
import fetch from "node-fetch";
import { KeywordAnalysis } from "@shared/schema";

// Initialize OpenAI with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Interface for the clarity analysis result
 */
export interface ClarityAnalysis {
  perceivedPurpose: {
    description: string;
    confidenceLevel: "high" | "medium" | "low";
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
    priority: "high" | "medium" | "low";
  };
}

/**
 * Extract visible text content from HTML
 */
function extractVisibleContent(html: string): {
  title: string;
  metaDescription: string;
  headings: string[];
  paragraphs: string[];
  linkTexts: string[];
} {
  const $ = load(html);

  // Remove script, style, and hidden elements
  $(
    'script, style, [style*="display:none"], [style*="display: none"], [hidden], noscript',
  ).remove();

  const title = $("title").text().trim();
  const metaDescription = $('meta[name="description"]').attr("content") || "";

  // Extract headings
  const headings: string[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, element) => {
    const headingText = $(element).text().trim();
    if (headingText) headings.push(headingText);
  });

  // Extract paragraphs
  const paragraphs: string[] = [];
  $("p").each((_, element) => {
    const paragraphText = $(element).text().trim();
    if (paragraphText) paragraphs.push(paragraphText);
  });

  // Extract link texts
  const linkTexts: string[] = [];
  $("a").each((_, element) => {
    const linkText = $(element).text().trim();
    if (linkText) linkTexts.push(linkText);
  });

  return {
    title,
    metaDescription,
    headings,
    paragraphs,
    linkTexts,
  };
}

/**
 * Create a clean, structured summary of website content for AI analysis
 */
function createContentSummary(
  content: {
    title: string;
    metaDescription: string;
    headings: string[];
    paragraphs: string[];
    linkTexts: string[];
  },
  keywords?: KeywordAnalysis,
): string {
  let summary = "";

  // Add title and meta description
  if (content.title) summary += `TITLE: ${content.title}\n\n`;
  if (content.metaDescription)
    summary += `META DESCRIPTION: ${content.metaDescription}\n\n`;

  // Add headings
  if (content.headings.length > 0) {
    summary += "MAIN HEADINGS:\n";
    content.headings.slice(0, 10).forEach((heading) => {
      summary += `- ${heading}\n`;
    });
    summary += "\n";
  }

  // Add a sample of paragraphs (limited to avoid token limits)
  if (content.paragraphs.length > 0) {
    summary += "CONTENT SAMPLES:\n";
    // Take at most 5 paragraphs, prioritize shorter ones that might be key messages
    const sampledParagraphs = content.paragraphs
      .filter((p) => p.length > 15) // Minimum length to filter out non-meaningful text
      .sort((a, b) => a.length - b.length) // Sort by length (shortest first)
      .slice(0, 5); // Take 5 paragraphs

    sampledParagraphs.forEach((paragraph) => {
      // Truncate very long paragraphs
      const truncated =
        paragraph.length > 300
          ? paragraph.substring(0, 300) + "..."
          : paragraph;
      summary += `${truncated}\n\n`;
    });
  }

  // Add keyword information if available
  if (keywords && keywords.topKeywords) {
    summary += "DETECTED KEYWORDS:\n";
    keywords.topKeywords
      .slice(0, 8)
      .forEach((kw: { keyword: string; frequency: number }) => {
        summary += `- ${kw.keyword} (frequency: ${kw.frequency})\n`;
      });
    summary += "\n";
  }

  // Add navigation context from link texts
  if (content.linkTexts.length > 0) {
    summary += "NAVIGATION ELEMENTS:\n";
    // Get unique link texts and limit to 10
    const uniqueLinksArray = Array.from(new Set(content.linkTexts)).slice(
      0,
      10,
    );
    uniqueLinksArray.forEach((link) => {
      summary += `- ${link}\n`;
    });
  }

  return summary;
}

/**
 * Analyze website clarity using OpenAI
 */
export async function analyzeCommunicationClarity(
  url: string,
  html: string,
  keywords?: KeywordAnalysis,
): Promise<ClarityAnalysis> {
  try {
    // Extract content from HTML
    const content = extractVisibleContent(html);

    // Prepare a structured summary for the AI
    const contentSummary = createContentSummary(content, keywords);

    // Limit content summary to prevent token limit issues
    const limitedSummary =
      contentSummary.length > 3000
        ? contentSummary.substring(0, 3000) + "... (content truncated)"
        : contentSummary;

    // Construct the prompt for OpenAI
    const prompt = `
You are an expert in web communication, UX writing, and digital marketing analysis. Your task is to evaluate how clearly and effectively a website communicates its purpose and value to a human visitor — especially through its metadata, visible text, and layout hints.

WEBSITE URL: ${url}

CONTENT EXTRACTED:
${limitedSummary}

Please perform a professional-level evaluation and return your response in valid JSON format using this structure:

{
  "perceivedPurpose": {
    "description": "Concise explanation of what you believe the website is about, based on the provided content.",
    "confidenceLevel": "high | medium | low — depending on how clearly the site communicates its intent.",
    "keyTerms": ["Top 3–5 terms or phrases that represent the site's main focus or theme."]
  },
  "clarityAssessment": {
    "score": 1–10 (how clearly the site communicates its message and intent),
    "strengths": ["Highlight 2–4 elements that are well-communicated (e.g., tone, value proposition, visual cues)."],
    "weaknesses": ["Identify 2–4 potential communication issues (e.g., vagueness, jargon, lack of CTA)."],
    "overallVerdict": "A 1–2 sentence summary of the communication quality."
  },
  "improvementSuggestions": {
    "copywriting": ["2–3 actionable suggestions to improve messaging, clarity, or tone of text."],
    "structure": ["2–3 layout or content hierarchy improvements for better communication flow."],
    "emphasis": ["2–3 suggestions on what elements should be visually or verbally emphasized more."],
    "priority": "high | medium | low — how urgent it is to apply these changes."
  }
}

Make sure:
- The JSON is well-structured and syntactically valid.
- Use consistent tone and avoid repetition.
- Think like a UX strategist advising a startup on clear digital communication.
`;

    console.log("OpenAI Prompt:", prompt);
    console.log("Calling OpenAI API with config:", {
      promptLength: prompt.length,
      url: url,
      timestamp: new Date().toISOString(),
    });

    try {
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content:
              "You are a web communication clarity expert that provides helpful, accurate, and specific feedback.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      // Parse the response
      const content_str = response.choices[0].message.content;
      if (!content_str) {
        throw new Error("Received empty response from OpenAI");
      }

      console.log(
        "OpenAI response received, content length:",
        content_str.length,
      );

      // Parse and validate the response
      const parsedResponse = JSON.parse(content_str);

      // Ensure the score is a number
      if (typeof parsedResponse.clarityAssessment.score === "string") {
        parsedResponse.clarityAssessment.score =
          parseInt(parsedResponse.clarityAssessment.score, 10) || 7;
      }

      return parsedResponse as ClarityAnalysis;
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);

      // Return a fallback analysis
      return {
        perceivedPurpose: {
          description:
            "Unable to analyze due to API error. This website appears to be a business or service website.",
          confidenceLevel: "low",
          keyTerms: ["website", "content", "service"],
        },
        clarityAssessment: {
          score: 5,
          strengths: ["Analysis unavailable due to API error"],
          weaknesses: ["Analysis unavailable due to API error"],
          overallVerdict: "Unable to complete analysis due to an API error.",
        },
        improvementSuggestions: {
          copywriting: ["Consider clearer messaging about your core services"],
          structure: ["Ensure important information is easy to find"],
          emphasis: ["Highlight your unique value proposition"],
          priority: "medium",
        },
      };
    }
  } catch (error) {
    console.error("Error analyzing communication clarity:", error);
    // Return a default error response
    return {
      perceivedPurpose: {
        description: "Unable to analyze website purpose due to an error.",
        confidenceLevel: "low",
        keyTerms: ["error", "analysis", "unavailable"],
      },
      clarityAssessment: {
        score: 0,
        strengths: ["Unable to determine strengths due to analysis error."],
        weaknesses: ["Unable to determine weaknesses due to analysis error."],
        overallVerdict:
          "Analysis failed. Please try again or contact support if the problem persists.",
      },
      improvementSuggestions: {
        copywriting: [
          "Unable to provide copywriting suggestions due to analysis error.",
        ],
        structure: [
          "Unable to provide structure suggestions due to analysis error.",
        ],
        emphasis: [
          "Unable to provide emphasis suggestions due to analysis error.",
        ],
        priority: "medium",
      },
    };
  }
}

/**
 * Fetch HTML content from a URL
 */
export async function fetchHtmlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch URL: ${response.status} ${response.statusText}`,
      );
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching HTML from ${url}:`, error);
    throw error;
  }
}
