import * as cheerio from "cheerio";
import natural from "natural";
import stopword from "stopword";
import { 
  KeywordAnalysis, 
  KeywordData, 
  KeywordIntent,
  KeywordSuggestion
} from "@shared/schema";

// Tokenization and stemming
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Common stopwords to filter out
const ADDITIONAL_STOPWORDS = [
  "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", 
  "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "will", "would", "shall", "should", "may", "might", "must", "can", "could",
  "to", "in", "on", "at", "by", "with", "about", "for", "from", "of",
  "https", "http", "www", "com", "net", "org", "html"
];

/**
 * Extract text content from HTML, removing scripts, styles, etc.
 */
function extractTextContent(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove script, style, and other non-content elements
  $('script, style, nav, footer, header, iframe, noscript').remove();
  
  // Extract text from body
  const bodyText = $('body').text();
  
  // Clean up whitespace and normalize
  return bodyText
    .replace(/\\s+/g, ' ')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Process text by tokenizing, removing stop words, and stemming
 */
function processText(text: string): string[] {
  // Tokenize text into words
  const tokens = tokenizer.tokenize(text) || [];
  
  // Filter out stopwords and single-character words
  const filteredTokens = stopword.removeStopwords(tokens)
    .filter(word => word.length > 1 && !ADDITIONAL_STOPWORDS.includes(word.toLowerCase()));
  
  // Return an array of stems
  return filteredTokens.map(token => stemmer.stem(token.toLowerCase()));
}

/**
 * Count word frequencies in a document
 */
function countWordFrequencies(tokens: string[]): Map<string, number> {
  const freqMap = new Map<string, number>();
  
  for (const token of tokens) {
    freqMap.set(token, (freqMap.get(token) || 0) + 1);
  }
  
  return freqMap;
}

/**
 * Calculate TF (Term Frequency) for each term in the document
 */
function calculateTF(wordFreq: Map<string, number>, docLength: number): Map<string, number> {
  const tfMap = new Map<string, number>();
  
  for (const [word, count] of wordFreq.entries()) {
    tfMap.set(word, count / docLength);
  }
  
  return tfMap;
}

/**
 * Determine a keyword's intent based on patterns and context
 */
function determineKeywordIntent(keyword: string, context: string): KeywordIntent {
  // Navigational patterns (brand names, specific sites, locations)
  const navigationalPatterns = [
    /login|sign in|account|profile|settings|dashboard|home|menu|search|find|locate|where|map|direction/i
  ];
  
  // Transactional patterns (buying, selling, obtaining, etc)
  const transactionalPatterns = [
    /buy|sell|purchase|order|shop|deal|price|cost|cheap|discount|sale|offer|promotion|coupon|free|shipping|pay|subscribe/i
  ];
  
  // Check if the keyword matches navigational patterns
  for (const pattern of navigationalPatterns) {
    if (pattern.test(keyword)) {
      return 'navigational';
    }
  }
  
  // Check if the keyword matches transactional patterns
  for (const pattern of transactionalPatterns) {
    if (pattern.test(keyword)) {
      return 'transactional';
    }
  }
  
  // Default to informational
  return 'informational';
}

/**
 * Generate related keyword suggestions based on the top keywords
 */
function generateSuggestions(keywords: KeywordData[], content: string): KeywordSuggestion[] {
  // Start with the top 5 keywords by TF-IDF
  const topKeywords = keywords.slice(0, 5);
  
  // Generate variations and combinations for each keyword
  const suggestions: KeywordSuggestion[] = [];
  
  for (const keyword of topKeywords) {
    // Add the primary keyword as a suggestion
    suggestions.push({
      keyword: keyword.keyword,
      relevance: keyword.tfidf * 100, // Scale to a 0-100 range
      intent: keyword.intent
    });
    
    // Generate compound suggestions by combining with other top keywords
    for (const other of topKeywords) {
      if (other.keyword !== keyword.keyword) {
        // Create a combined term
        const combinedTerm = `${keyword.keyword} ${other.keyword}`;
        
        // Only add if it appears in the content
        if (content.includes(combinedTerm)) {
          suggestions.push({
            keyword: combinedTerm,
            relevance: (keyword.tfidf + other.tfidf) * 90, // Slightly lower than primary
            intent: determineKeywordIntent(combinedTerm, content)
          });
        }
      }
    }
  }
  
  // Sort suggestions by relevance and take the top 5
  return suggestions
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

/**
 * Reconstruct original word forms from stems for display
 */
function reconstructKeywords(
  stemmedKeywords: { stem: string; tf: number; tfidf: number; }[],
  originalText: string
): KeywordData[] {
  // Tokenize the original text
  const tokens = tokenizer.tokenize(originalText.toLowerCase()) || [];
  
  // Map stems to their original forms
  const stemToOriginal = new Map<string, string>();
  for (const token of tokens) {
    if (token.length > 1) {
      const stem = stemmer.stem(token.toLowerCase());
      if (!stemToOriginal.has(stem) || token.length > stemToOriginal.get(stem)!.length) {
        stemToOriginal.set(stem, token);
      }
    }
  }
  
  // Map the stemmed keywords to their original forms
  return stemmedKeywords.map(item => {
    const originalForm = stemToOriginal.get(item.stem) || item.stem;
    return {
      keyword: originalForm,
      frequency: Math.round(item.tf * 1000), // Scale frequency for display
      tfidf: item.tfidf,
      intent: determineKeywordIntent(originalForm, originalText)
    };
  });
}

/**
 * Perform TF-IDF analysis on HTML content
 */
export function analyzeKeywords(html: string, title: string = "", description: string = ""): KeywordAnalysis {
  // Extract text content from HTML
  const textContent = extractTextContent(html);
  const combinedText = `${title} ${description} ${textContent}`;
  
  // Process text into tokens
  const tokens = processText(combinedText);
  const tokenCount = tokens.length;
  
  // Count word frequencies
  const wordFreqs = countWordFrequencies(tokens);
  
  // Calculate term frequency (TF)
  const tfScores = calculateTF(wordFreqs, tokenCount);
  
  // For a single document, IDF isn't properly calculable, so we'll use a simplified approach
  // Instead of comparing across documents, we'll weight terms by their inverse frequency in the document
  const tfidfScores: { stem: string; tf: number; tfidf: number; }[] = Array.from(tfScores.entries())
    .map(([term, tf]) => {
      // Calculate a pseudo-IDF based on term rarity in this document
      const pseudoIdf = Math.log(tokenCount / (wordFreqs.get(term) || 1));
      return { 
        stem: term,
        tf: wordFreqs.get(term) || 0,
        tfidf: tf * pseudoIdf
      };
    })
    .sort((a, b) => b.tfidf - a.tfidf)
    .slice(0, 15); // Get top 15 keywords by TF-IDF score
  
  // Reconstruct original keywords from stems
  const topKeywords = reconstructKeywords(tfidfScores, combinedText);
  
  // Generate related keyword suggestions
  const suggestions = generateSuggestions(topKeywords, combinedText);
  
  return {
    topKeywords,
    suggestions,
    contentLength: textContent.length
  };
}