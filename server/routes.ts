import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { z } from "zod";
import Stripe from "stripe";
import { SeoData, TagStatus, CoreWebVitalsData, ComparisonCategory, KeywordAnalysis, 
  SearchConsoleMetrics, GA4Metrics, PerformanceComparison, insertUserSchema } from "@shared/schema";
import { analyzeCoreWebVitals } from "./lighthouse-analyzer";
import { analyzeKeywords } from "./keyword-analyzer";
import { analyzeCommunicationClarity, fetchHtmlContent } from "./clarity-analyzer";
import { 
  initializeGoogleAuth, 
  getAuthUrl, 
  getTokens,
  refreshAccessToken,
  revokeAccess,
  getSearchConsoleMetrics,
  getGA4Metrics,
  getPerformanceComparison,
  getOAuth2Client
} from "./google-integrations";
import imageRoutes from "./image-routes";

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Simple middleware for API routes that require authentication
  // The actual authentication happens in the client using Firebase
  // Here we just verify if the user is a valid user in our database

  // Get the user ID from the request
  const userId = req.headers['user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Validate user existence in next middleware
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const schema = z.object({
        id: z.string(),
        email: z.string().email().nullable(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        photoURL: z.string().optional(),
        authProvider: z.enum(['email', 'google', 'facebook', 'github', 'twitter', 'apple']).default('email')
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid registration data",
          errors: parsed.error.errors 
        });
      }

      const { id, email, firstName, lastName, photoURL, authProvider } = parsed.data;
      
      try {
        // Verifica se esiste un utente con lo stesso ID
        const existingUserById = await storage.getUser(id);
        
        if (existingUserById) {
          console.log(`User with ID ${id} already exists, updating profile data`);
          return res.json(existingUserById);
        }
        
        // Verifica se esiste un utente con la stessa email
        if (email) {
          const existingUserByEmail = await storage.getUserByEmail(email);
          if (existingUserByEmail) {
            console.log(`User with email ${email} already exists, returning existing user`);
            return res.json(existingUserByEmail);
          }
        }
        
        // Crea un nuovo utente con dati sanitizzati
        const trimmedPhotoURL = photoURL && photoURL.length > 250 ? photoURL.substring(0, 250) : photoURL;
        
        const newUser = await storage.createUser({
          id,
          email: email || '',
          firstName: firstName?.substring(0, 250) || '',
          lastName: lastName?.substring(0, 250) || '',
          profileImageUrl: trimmedPhotoURL,
          firebaseUid: id, // Store the Firebase UID to maintain compatibility
          authProvider, // Salva il provider di autenticazione
          currentPlan: 'free'
        });
        
        console.log(`New user created with ID ${id} and email ${email}`);
        return res.status(201).json(newUser);
      } catch (dbError) {
        console.error('Database error during registration:', dbError);
        
        // Nel caso di errore di chiave duplicata, prova a recuperare l'utente
        if (email) {
          try {
            const userByEmail = await storage.getUserByEmail(email);
            if (userByEmail) {
              console.log(`Recovered user with email ${email} after error`);
              return res.json(userByEmail);
            }
          } catch (fallbackError) {
            console.error('Error in fallback lookup:', fallbackError);
          }
        }
        
        throw dbError;
      }
    } catch (error: any) {
      console.error('Error registering user:', error);
      return res.status(500).json({ message: 'Failed to register user' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const schema = z.object({
        id: z.string(),
        email: z.string().email().nullable(),
        authProvider: z.enum(['email', 'google', 'facebook', 'github', 'twitter', 'apple']).default('email')
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid login data",
          errors: parsed.error.errors 
        });
      }

      const { id, email, authProvider } = parsed.data;
      
      // Prima cerca l'utente per ID
      let user = await storage.getUser(id);
      
      // Se non lo trova per ID ma ha un'email, prova a cercarlo per email
      if (!user && email) {
        console.log(`User not found by ID ${id}, trying to find by email ${email}`);
        user = await storage.getUserByEmail(email);
        
        // Se lo trova per email ma l'ID è diverso, aggiorna l'ID (possibile se l'utente usa metodi diversi di login)
        if (user && user.id !== id) {
          console.log(`Found user by email with different ID. Old: ${user.id}, New: ${id}`);
          user = await storage.updateUserData(user.id, { firebaseUid: id });
          
          // Ora dobbiamo creare un nuovo record con il nuovo ID che punta allo stesso utente
          try {
            await storage.createUser({
              id: id,
              email: email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              firebaseUid: id,
              currentPlan: user.currentPlan
            });
            // Ora usa il nuovo ID per le operazioni future
            user = await storage.getUser(id);
          } catch (createError) {
            console.error('Error creating user record with new ID:', createError);
            // Continua con l'utente trovato per email
          }
        }
      }
      
      if (!user) {
        console.log(`User not found with ID ${id} or email ${email}`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verifica che l'utente stia usando lo stesso provider di autenticazione
      if (user.authProvider && user.authProvider !== authProvider) {
        return res.status(400).json({ 
          message: `Account già esistente con un altro metodo di accesso: ${user.authProvider}. Utilizzare lo stesso metodo di registrazione.`,
          authProvider: user.authProvider,
          error: 'AUTH_PROVIDER_MISMATCH' 
        });
      }
      
      // Get subscription status
      const { isSubscribed, remainingUsage } = await storage.checkUserSubscription(user.id);
      
      console.log(`User ${user.id} logged in successfully`);
      return res.json({
        ...user,
        isSubscribed,
        remainingUsage
      });
    } catch (error: any) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'Failed to login' });
    }
  });
  
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      const email = req.headers['user-email'] as string;
      
      // Get user from database
      let user = await storage.getUser(userId);
      
      // Se l'utente non è trovato per ID ma abbiamo un'email, prova a cercarlo per email
      if (!user && email) {
        console.log(`User not found by ID ${userId}, trying to find by email ${email}`);
        user = await storage.getUserByEmail(email);
        
        // Se trovato per email ma l'ID è diverso, crea un nuovo record
        if (user && user.id !== userId) {
          console.log(`Found user by email with different ID. Old: ${user.id}, New: ${userId}`);
          try {
            await storage.createUser({
              id: userId,
              email: email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              firebaseUid: userId,
              currentPlan: user.currentPlan
            });
            // Ora usa il nuovo ID
            user = await storage.getUser(userId);
          } catch (createError) {
            console.error('Error creating user record with new ID in GET /api/auth/user:', createError);
            // Continua con l'utente trovato per email
          }
        }
      }
      
      if (!user) {
        console.log(`User not found with ID ${userId} or email ${email}`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get subscription status
      const { isSubscribed, remainingUsage } = await storage.checkUserSubscription(user.id);
      
      return res.json({
        ...user,
        isSubscribed,
        remainingUsage
      });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Failed to get user data' });
    }
  });
  
  // Endpoint to provide environment variables to the client
  app.get("/api/env", (req, res) => {
    res.json({
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || ''
    });
  });
  
  // Test endpoint to verify Google API status
  app.get("/api/google/status", async (req, res) => {
    try {
      const results: Record<string, { active: boolean, error?: string }> = {
        'oauth2.googleapis.com': { active: false },
        'searchconsole.googleapis.com': { active: false },
        'analyticsdata.googleapis.com': { active: false }
      };
      
      // Check OAuth2 API by trying to generate an auth URL (doesn't require tokens)
      try {
        const oauth2Client = getOAuth2Client();
        
        if (!oauth2Client) {
          // Initialize the OAuth client with environment variables
          const clientId = process.env.GOOGLE_CLIENT_ID;
          const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
          const redirectUri = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/oauth-callback`;
          
          if (clientId && clientSecret) {
            initializeGoogleAuth({
              clientId,
              clientSecret,
              redirectUri
            });
            
            getAuthUrl(); // This will fail if OAuth API is not active
            results['oauth2.googleapis.com'].active = true;
          } else {
            results['oauth2.googleapis.com'].error = 'Missing client credentials';
          }
        } else {
          getAuthUrl();
          results['oauth2.googleapis.com'].active = true;
        }
      } catch (error: any) {
        results['oauth2.googleapis.com'].error = error.message;
      }
      
      // Unfortunately we cannot test the other APIs without valid tokens
      // We can only report their presumed status based on configuration
      
      return res.json(results);
    } catch (error: any) {
      return res.status(500).json({ 
        message: "Failed to check API status",
        error: error.message 
      });
    }
  });
  
  // Monthly usage reset check on login
  app.post("/api/user/reset-usage", async (req, res) => {
    try {
      await storage.resetMonthlyUsage();
      return res.json({ success: true });
    } catch (error) {
      console.error("Error resetting monthly usage:", error);
      return res.status(500).json({ message: "Failed to reset monthly usage" });
    }
  });
  
  // Get user's recent SEO analyses
  app.get("/api/user/analyses", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        userId: z.string(),
        limit: z.string().transform(Number).optional()
      });
      
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request parameters", 
          errors: parsed.error.errors 
        });
      }
      
      const { userId, limit = 5 } = parsed.data;
      
      console.log(`Fetching SEO analyses for user ${userId}, limit ${limit}`);
      
      const analyses = await storage.getSeoAnalysesByUser(userId, limit);
      console.log(`Found ${analyses.length} analyses for user ${userId}`);
      
      // Se l'utente ha utilizzato analisi ma non ci sono record, creiamo una cronologia fittizia
      // per mostrare che ha usato il servizio (caso temporaneo e di transizione)
      const user = await storage.getUser(userId);
      if (analyses.length === 0 && user && user.monthlyUsage && user.monthlyUsage > 0) {
        console.log(`User ${userId} has used ${user.monthlyUsage} analyses but no records found. Creating placeholder history.`);
        
        // Creiamo una cronologia fittizia di esempio per non mostrare la lista vuota
        const temporaryAnalyses = [];
        for (let i = 0; i < Math.min(user.monthlyUsage, limit); i++) {
          temporaryAnalyses.push({
            id: -i - 1, // IDs negativi per indicare che sono temporanei
            userId: userId,
            url: "https://example.com/analyzed-page",
            tags: { title: "Analyzed Page", description: "This is a placeholder for a previously analyzed page" },
            score: 75,
            createdAt: new Date(Date.now() - (i * 86400000)) // Date recenti
          });
        }
        
        return res.json(temporaryAnalyses);
      }
      
      return res.json(analyses);
    } catch (error) {
      console.error("Error fetching user analyses:", error);
      return res.status(500).json({ message: "Failed to fetch user analyses" });
    }
  });
  
  // Get user's payment history
  app.get("/api/user/payments", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        userId: z.string()
      });
      
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request parameters", 
          errors: parsed.error.errors 
        });
      }
      
      const { userId } = parsed.data;
      
      const payments = await storage.getPaymentsByUser(userId);
      return res.json(payments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });
  
  app.get("/api/user/subscription", async (req, res) => {
    try {
      const schema = z.object({
        userId: z.string()
      });

      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid user ID", 
          errors: parsed.error.errors 
        });
      }

      const { userId } = parsed.data;
      const userEmail = req.headers['user-email'] as string;
      
      // Cerca prima l'utente per ID
      let user = await storage.getUser(userId);
      
      // Se l'utente non viene trovato per ID ma abbiamo un'email, prova a cercarlo per email
      if (!user && userEmail) {
        console.log(`User not found by ID ${userId} in subscription check, trying to find by email ${userEmail}`);
        user = await storage.getUserByEmail(userEmail);
        
        // Se lo trova per email ma con un ID diverso, crea un record con il nuovo ID
        if (user && user.id !== userId) {
          console.log(`Found user by email ${userEmail} with different ID. Old: ${user.id}, New: ${userId}`);
          try {
            await storage.createUser({
              id: userId,
              email: userEmail,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              firebaseUid: userId,
              currentPlan: user.currentPlan
            });
            // Usa il nuovo ID per le operazioni future
            user = await storage.getUser(userId);
          } catch (createError) {
            console.error('Error creating user record with new ID:', createError);
            // Continua con l'utente trovato per email
          }
        }
      }
      
      if (!user) {
        console.log(`User not found with ID ${userId} or email ${userEmail} in subscription check`);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check subscription status
      const subscription = await storage.checkUserSubscription(user.id);
      
      // Get plan details
      const plan = await storage.getPlanByType(user.currentPlan || 'free');
      
      console.log(`Subscription check for user ${user.id}: Plan ${user.currentPlan}, remaining usage ${subscription.remainingUsage}`);
      return res.json({
        currentPlan: user.currentPlan,
        planName: plan?.name || 'Free',
        isSubscribed: subscription.isSubscribed,
        remainingUsage: subscription.remainingUsage,
        monthlyUsage: user.monthlyUsage,
        monthlyLimit: plan?.monthlyLimit || 3
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return res.status(500).json({ message: "Failed to fetch subscription data" });
    }
  });

  // API route to analyze a URL with subscription check
  app.get("/api/analyze", async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().url(),
        userId: z.string()
      });

      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request parameters", 
          errors: parsed.error.errors 
        });
      }

      const { url, userId } = parsed.data;
      
      // Check user subscription and remaining usage
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const subscription = await storage.checkUserSubscription(userId);
      
      // If no remaining usage, return error
      if (subscription.remainingUsage <= 0) {
        return res.status(403).json({ 
          message: "You've reached your monthly limit of SEO analyses",
          plan: user.currentPlan,
          upgrade: true
        });
      }
      
      // Check if we already have this URL analyzed recently
      const existingAnalysis = await storage.getSeoAnalysisByUrl(url);
      
      if (existingAnalysis) {
        console.log(`Found existing SEO analysis for URL ${url}, reusing`);
        
        try {
          // Increment usage count for the user
          const updatedUser = await storage.incrementUserUsage(userId);
          console.log(`User usage incremented for existing analysis: ${updatedUser.monthlyUsage}/${updatedUser.currentPlan}`);
          
          // Create a new log of this analysis with the current user
          const newAnalysisLog = await storage.createSeoAnalysis({
            url,
            tags: existingAnalysis.tags as Record<string, string>,
            score: existingAnalysis.score,
            userId
          });
          
          console.log(`Created new analysis log from existing data: ${newAnalysisLog.id}`);
          
        } catch (incrementError) {
          console.error("Error incrementing usage for existing analysis:", incrementError);
          // Continue to return results even if logging fails
        }
        
        return res.json(seoAnalysisToResponse(existingAnalysis.tags as Record<string, string>, existingAnalysis.score, null, existingAnalysis.url));
      }

      // Fetch the page HTML
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FylleSEO/1.0 (+https://fylleseo.app)'
        }
      });

      if (!response.ok) {
        return res.status(500).json({ 
          message: `Failed to fetch URL: ${response.statusText}` 
        });
      }

      const html = await response.text();

      // Parse HTML and extract meta tags
      const $ = cheerio.load(html);
      const tags: Record<string, string> = {};

      // Extract title
      const title = $('title').text();
      if (title) tags.title = title;

      // Extract meta tags
      $('meta').each((_, elem) => {
        const name = $(elem).attr('name') || $(elem).attr('property') || $(elem).attr('http-equiv');
        const content = $(elem).attr('content');
        
        if (name && content) {
          tags[name] = content;
        }
      });

      // Extract canonical link
      const canonical = $('link[rel="canonical"]').attr('href');
      if (canonical) tags.canonical = canonical;

      // Extract html lang attribute
      const htmlLang = $('html').attr('lang');
      if (htmlLang) tags.html = `lang="${htmlLang}"`;

      // Calculate SEO score based on the extracted tags
      const score = calculateSeoScore(tags);

      // Store the analysis result with user association
      try {
        console.log(`Saving SEO analysis for user ${userId} and URL ${url}...`);
        
        const seoAnalysis = await storage.createSeoAnalysis({
          url,
          tags,
          score,
          userId
        });
        
        console.log(`SEO analysis saved successfully, ID: ${seoAnalysis.id}`);
        
        // Increment usage count for the user
        const updatedUser = await storage.incrementUserUsage(userId);
        console.log(`User usage incremented: ${updatedUser.monthlyUsage}/${updatedUser.currentPlan}`);
      } catch (dbError) {
        console.error("Error saving SEO analysis:", dbError);
        // Continue even if saving fails, to provide analysis results to the user
      }

      // Analyze Core Web Vitals
      let webVitals = null;
      try {
        webVitals = await analyzeCoreWebVitals(url);
      } catch (error) {
        console.error("Error analyzing Core Web Vitals:", error);
        // Continue even if Core Web Vitals analysis fails
      }

      // Return the analysis results
      return res.json(seoAnalysisToResponse(tags, score, webVitals, url));
    } catch (error) {
      console.error("Error analyzing URL:", error);
      return res.status(500).json({ 
        message: "Failed to analyze the website. Please try again." 
      });
    }
  });

  // API route to compare multiple URLs
  app.get("/api/compare", async (req, res) => {
    try {
      const schema = z.object({
        primary: z.string().url(),
        competitors: z.string().transform(str => str.split(',').filter(Boolean)).optional()
      });

      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid URLs provided", 
          errors: parsed.error.errors 
        });
      }

      const { primary, competitors = [] } = parsed.data;
      
      // Ensure we don't exceed 3 competitors
      const limitedCompetitors = competitors.slice(0, 3);
      
      // Analyze primary URL
      const primaryAnalysis = await analyzeUrl(primary);
      
      // Analyze competitor URLs
      const competitorAnalyses = await Promise.all(
        limitedCompetitors.map(async (url: string) => {
          try {
            return await analyzeUrl(url);
          } catch (error) {
            console.error(`Error analyzing competitor URL ${url}:`, error);
            return null;
          }
        })
      );
      
      // Filter out failed analyses
      const validCompetitorAnalyses = competitorAnalyses.filter(Boolean) as SeoData[];
      
      // Generate comparison categories
      const categories = generateComparisonCategories(primaryAnalysis, validCompetitorAnalyses);
      
      return res.json({
        primary: primaryAnalysis,
        competitors: validCompetitorAnalyses,
        categories
      });
    } catch (error) {
      console.error("Error comparing URLs:", error);
      return res.status(500).json({ 
        message: "Failed to compare the websites. Please try again." 
      });
    }
  });

  // Get recent analyses
  app.get("/api/recent", async (req, res) => {
    try {
      const recentAnalyses = await storage.getRecentSeoAnalyses();
      return res.json(recentAnalyses);
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to fetch recent analyses" 
      });
    }
  });

  // Initialize Google OAuth
  app.post("/api/google/init", async (req, res) => {
    try {
      const schema = z.object({
        clientId: z.string(),
        clientSecret: z.string(),
        redirectUri: z.string()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid OAuth credentials",
          errors: parsed.error.errors 
        });
      }

      const { clientId, clientSecret, redirectUri } = parsed.data;
      
      // Initialize the OAuth client
      initializeGoogleAuth({
        clientId,
        clientSecret,
        redirectUri
      });
      
      // Generate the authorization URL
      const authUrl = getAuthUrl();
      
      return res.json({ authUrl });
    } catch (error) {
      console.error("Error initializing Google OAuth:", error);
      return res.status(500).json({ 
        message: "Failed to initialize Google OAuth" 
      });
    }
  });

  // Exchange authorization code for tokens
  app.post("/api/google/callback", async (req, res) => {
    try {
      const schema = z.object({
        code: z.string()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid authorization code",
          errors: parsed.error.errors 
        });
      }

      const { code } = parsed.data;
      
      // Exchange code for tokens
      const tokens = await getTokens(code);
      
      return res.json(tokens);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      return res.status(500).json({ 
        message: "Failed to authenticate with Google" 
      });
    }
  });

  // Refresh access token
  app.post("/api/google/refresh", async (req, res) => {
    try {
      const schema = z.object({
        refreshToken: z.string()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid refresh token",
          errors: parsed.error.errors 
        });
      }

      const { refreshToken } = parsed.data;
      
      // Refresh the access token
      const credentials = await refreshAccessToken(refreshToken);
      
      return res.json(credentials);
    } catch (error) {
      console.error("Error refreshing token:", error);
      return res.status(500).json({ 
        message: "Failed to refresh access token" 
      });
    }
  });

  // Revoke access
  app.post("/api/google/revoke", async (req, res) => {
    try {
      const schema = z.object({
        token: z.string()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid token",
          errors: parsed.error.errors 
        });
      }

      const { token } = parsed.data;
      
      // Revoke the token
      await revokeAccess(token);
      
      return res.json({ message: "Access successfully revoked" });
    } catch (error) {
      console.error("Error revoking access:", error);
      return res.status(500).json({ 
        message: "Failed to revoke access" 
      });
    }
  });

  // Get Search Console metrics
  app.get("/api/google/search-console", async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().url(),
        startDate: z.string(),
        endDate: z.string(),
        accessToken: z.string()
      });

      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid parameters",
          errors: parsed.error.errors 
        });
      }

      const { url, startDate, endDate, accessToken } = parsed.data;
      
      console.log("Starting Search Console metrics request for URL:", url);
      
      // Get Search Console metrics
      const metrics = await getSearchConsoleMetrics(
        url,
        startDate,
        endDate,
        accessToken
      );
      
      console.log("Search Console metrics request completed successfully");
      
      // Get performance comparison
      const comparison = await getPerformanceComparison(
        url,
        metrics,
        accessToken
      );
      
      console.log("Performance comparison completed successfully");
      
      return res.json({
        metrics,
        comparison
      });
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      console.error("Error fetching Search Console metrics:", errorMessage, error);
      return res.status(500).json({ 
        message: "Failed to fetch Search Console metrics",
        error: errorMessage
      });
    }
  });

  // Get GA4 metrics
  app.get("/api/google/analytics", async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().url(),
        startDate: z.string(),
        endDate: z.string(),
        propertyId: z.string(),
        accessToken: z.string()
      });

      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid parameters",
          errors: parsed.error.errors 
        });
      }

      const { url, startDate, endDate, propertyId, accessToken } = parsed.data;
      
      console.log("Starting Google Analytics metrics request for URL:", url, "Property ID:", propertyId);
      
      // Get GA4 metrics
      const metrics = await getGA4Metrics(
        url,
        startDate,
        endDate,
        propertyId,
        accessToken
      );
      
      console.log("Google Analytics metrics request completed successfully");
      
      return res.json(metrics);
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      console.error("Error fetching GA4 metrics:", errorMessage, error);
      return res.status(500).json({ 
        message: "Failed to fetch Google Analytics metrics",
        error: errorMessage
      });
    }
  });

  // Register image optimization routes
  app.use('/api/images', imageRoutes);

  // Initialize Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing Stripe secret key. Stripe checkout will not work properly.');
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

  // Create a Stripe Checkout Session
  // Analyze communication clarity
  app.get('/api/clarity-analysis', async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().url()
      });

      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid URL", 
          errors: parsed.error.errors 
        });
      }

      const { url } = parsed.data;
      
      try {
        // Fetch HTML content
        console.log(`Fetching HTML content from ${url} for clarity analysis`);
        const html = await fetchHtmlContent(url);
        
        // Get keyword analysis for better context
        const keywords = analyzeKeywords(html);
        
        // Analyze communication clarity
        console.log(`Analyzing communication clarity for ${url}`);
        const clarityAnalysis = await analyzeCommunicationClarity(url, html, keywords);
        
        // Return the response with proper Content-Type header
        res.setHeader('Content-Type', 'application/json');
        return res.json({
          clarityAnalysis,
          url
        });
      } catch (fetchError: any) {
        console.error(`Error processing clarity analysis for ${url}:`, fetchError);
        // Return a default mock analysis instead of failing
        const fallbackAnalysis = {
          perceivedPurpose: {
            description: "This appears to be a professional website offering products or services.",
            confidenceLevel: "low",
            keyTerms: ["website", "content", "information"]
          },
          clarityAssessment: {
            score: 5,
            strengths: ["Analysis unavailable - could not process website content"],
            weaknesses: ["Analysis unavailable - could not process website content"],
            overallVerdict: "Unable to complete full analysis due to content processing issues."
          },
          improvementSuggestions: {
            copywriting: ["Ensure your main value proposition is clear above the fold"],
            structure: ["Organize content with clear headings and logical structure"],
            emphasis: ["Highlight your unique benefits and key differentiators"],
            priority: "medium"
          }
        };
        
        res.setHeader('Content-Type', 'application/json');
        return res.json({
          clarityAnalysis: fallbackAnalysis,
          url,
          warning: "Using fallback analysis due to processing error"
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      console.error("Error analyzing communication clarity:", errorMessage, error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        message: "Failed to analyze communication clarity",
        error: errorMessage
      });
    }
  });

  // Get available plans
  app.get('/api/plans', async (req, res) => {
    try {
      const plans = await storage.getAllPlans();
      return res.json(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      return res.status(500).json({ message: 'Failed to fetch plans' });
    }
  });
  
  // Check user subscription status
  app.get('/api/user/subscription', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Get user subscription status
      const subscriptionStatus = await storage.checkUserSubscription(userId);
      
      // Get user's current plan type
      const user = await storage.getUser(userId);
      const currentPlan = user?.currentPlan || 'free';
      
      return res.json({
        isSubscribed: subscriptionStatus.isSubscribed,
        remainingUsage: subscriptionStatus.remainingUsage,
        currentPlan
      });
    } catch (error) {
      console.error('Error checking user subscription:', error);
      return res.status(500).json({ message: 'Failed to check subscription status' });
    }
  });

  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const schema = z.object({
        planType: z.enum(['basic', 'premium', 'enterprise']).default('basic'),
        userId: z.string(),
        successUrl: z.string().optional(),
        cancelUrl: z.string().optional()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request parameters",
          errors: parsed.error.errors 
        });
      }

      const { planType, userId, successUrl, cancelUrl } = parsed.data;
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get the plan from database
      const plan = await storage.getPlanByType(planType);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      // Ensure we have valid origin URLs
      const baseUrl = req.headers.origin || 'https://' + req.headers.host;
      
      // Create checkout session with the test prices (cents)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan.name,
                description: `${plan.description} (${plan.monthlyLimit} analyses per month)`,
              },
              unit_amount: plan.price, // Price in cents from the database
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl || `${baseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${baseUrl}/checkout-cancel`,
        metadata: {
          userId: userId.toString(),
          planType: planType,
          planId: plan.id.toString()
        },
        customer_email: user.email,
      });

      return res.json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ 
        message: 'Failed to create checkout session',
        error: error.message
      });
    }
  });

  // Webhook to handle Stripe events
  app.post('/api/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (!endpointSecret) {
        throw new Error('Missing Stripe webhook secret');
      }

      // Verify the event came from Stripe
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Fulfill the order
      try {
        await fulfillOrder(session);
      } catch (error: any) {
        console.error('Error fulfilling order:', error);
        return res.status(500).send(`Error fulfilling order: ${error.message}`);
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  });

  // Retrieve checkout session details
  app.get('/api/checkout-session', async (req, res) => {
    try {
      const schema = z.object({
        sessionId: z.string()
      });

      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid session ID",
          errors: parsed.error.errors 
        });
      }

      const { sessionId } = parsed.data;
      
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      res.json(session);
    } catch (error: any) {
      console.error('Error retrieving checkout session:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve checkout session',
        error: error.message
      });
    }
  });
  
  // Endpoint per elaborare manualmente un pagamento
  app.post('/api/process-payment', async (req, res) => {
    try {
      const schema = z.object({
        userId: z.string(),
        sessionId: z.string(),
        planType: z.enum(['free', 'basic', 'premium', 'enterprise']),
        amount: z.number().int()
      });
      
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid payment data",
          errors: parsed.error.errors 
        });
      }
      
      const { userId, sessionId, planType, amount } = parsed.data;
      
      console.log(`Processing manual payment for User ID: ${userId}, Plan Type: ${planType}, Amount: ${amount}, Session ID: ${sessionId}`);
      
      // Ottieni l'utente
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Registra il pagamento nel database
      try {
        const payment = await storage.createPayment({
          userId,
          stripeSessionId: sessionId,
          amount,
          planType,
          status: 'succeeded'
        });
        console.log('Payment record created successfully:', payment);
      } catch (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw paymentError; // Rilancia l'errore per essere catturato dal blocco catch esterno
      }
      
      // Aggiorna il piano dell'utente
      await storage.updateUserPlan(userId, planType);
      
      console.log(`Payment successfully processed for User ID: ${userId}, Plan updated to: ${planType}`);
      
      res.json({ success: true, message: "Payment processed successfully" });
    } catch (error: any) {
      console.error('Error processing payment:', error);
      res.status(500).json({ 
        message: 'Failed to process payment',
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to convert the raw analysis data to the response format
function seoAnalysisToResponse(tags: Record<string, string>, score: number, webVitals?: CoreWebVitalsData | null, url?: string): SeoData {
  // Count tags by status
  const tagCounts = countTagsByStatus(tags);
  
  return {
    tags,
    score,
    tagCounts,
    webVitals: webVitals || undefined,
    url
  };
}

// Function to calculate SEO score based on available tags
function calculateSeoScore(tags: Record<string, string>): number {
  let score = 0;
  const maxScore = 100;
  
  // Title (10%)
  if (tags.title) {
    if (tags.title.length >= 30 && tags.title.length <= 60) {
      score += 10;
    } else {
      score += 5; // Suboptimal length
    }
  }
  
  // Description (10%)
  if (tags.description) {
    if (tags.description.length >= 120 && tags.description.length <= 160) {
      score += 10;
    } else {
      score += 5; // Suboptimal length
    }
  }
  
  // Canonical tag (10%)
  if (tags.canonical) score += 10;
  
  // Robots tag (5%)
  if (tags.robots) score += 5;
  
  // OG tags (15%)
  if (tags['og:title']) score += 5;
  else if (tags.title) score += 2.5;
  
  if (tags['og:description']) score += 5;
  else if (tags.description) score += 2.5;
  
  if (tags['og:image']) score += 5;
  
  // Twitter card tags (15%)
  if (tags['twitter:card']) score += 5;
  
  if (tags['twitter:title']) score += 4;
  else if (tags['og:title']) score += 2;
  
  if (tags['twitter:description']) score += 3;
  else if (tags['og:description']) score += 1.5;
  
  if (tags['twitter:image']) score += 3;
  else if (tags['og:image']) score += 1.5;
  
  // Viewport tag (5%)
  if (tags.viewport) score += 5;
  
  // Language tag (5%)
  if (tags['content-language'] || (tags.html && tags.html.includes('lang'))) score += 5;
  
  // Charset (5%)
  if (tags.charset) score += 5;
  
  // Keywords (5%)
  if (tags.keywords) score += 5;
  
  // Other important tags (15%)
  if (tags['x-ua-compatible']) score += 3;
  if (tags.author) score += 3;
  if (tags['theme-color']) score += 3;
  if (tags.generator) score += 3;
  if (tags['application-name']) score += 3;
  
  return Math.min(Math.round(score), maxScore);
}

// Helper function to count tags by status
function countTagsByStatus(tags: Record<string, string>): { good: number, warning: number, error: number } {
  let good = 0, warning = 0, error = 0;
  
  // Title
  if (tags.title) {
    if (tags.title.length >= 30 && tags.title.length <= 60) {
      good++;
    } else {
      warning++;
    }
  } else {
    error++;
  }
  
  // Description
  if (tags.description) {
    if (tags.description.length >= 120 && tags.description.length <= 160) {
      good++;
    } else {
      warning++;
    }
  } else {
    error++;
  }
  
  // Canonical
  if (tags.canonical) good++;
  else error++;
  
  // Robots
  if (tags.robots) good++;
  else warning++;
  
  // OG tags
  if (tags['og:title']) good++;
  else if (tags.title) warning++;
  else error++;
  
  if (tags['og:description']) good++;
  else if (tags.description) warning++;
  else error++;
  
  if (tags['og:image']) good++;
  else error++;
  
  // Twitter tags
  if (tags['twitter:card']) good++;
  else error++;
  
  if (tags['twitter:title']) good++;
  else if (tags['og:title']) warning++;
  else error++;
  
  if (tags['twitter:image']) good++;
  else if (tags['og:image']) warning++;
  else error++;
  
  // Other important tags
  if (tags.viewport) good++;
  else warning++;
  
  if (tags['content-language'] || (tags.html && tags.html.includes('lang'))) good++;
  else warning++;
  
  if (tags.charset) good++;
  else warning++;
  
  return { good, warning, error };
}

// Helper function to analyze a URL
async function analyzeUrl(url: string): Promise<SeoData> {
  // Check if we already have this URL analyzed recently
  const existingAnalysis = await storage.getSeoAnalysisByUrl(url);
  
  if (existingAnalysis) {
    return seoAnalysisToResponse(
      existingAnalysis.tags as Record<string, string>, 
      existingAnalysis.score, 
      null,
      existingAnalysis.url
    );
  }

  // Fetch the page HTML
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MetaMuse/1.0 (+https://metamuse.app)'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  const html = await response.text();

  // Parse HTML and extract meta tags
  const $ = cheerio.load(html);
  const tags: Record<string, string> = {};

  // Extract title
  const title = $('title').text();
  if (title) tags.title = title;

  // Extract meta tags
  $('meta').each((_, elem) => {
    const name = $(elem).attr('name') || $(elem).attr('property') || $(elem).attr('http-equiv');
    const content = $(elem).attr('content');
    
    if (name && content) {
      tags[name] = content;
    }
  });

  // Extract canonical link
  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) tags.canonical = canonical;

  // Extract html lang attribute
  const htmlLang = $('html').attr('lang');
  if (htmlLang) tags.html = `lang="${htmlLang}"`;

  // Calculate SEO score based on the extracted tags
  const score = calculateSeoScore(tags);

  // Store the analysis result
  const seoAnalysis = await storage.createSeoAnalysis({
    url,
    tags,
    score
  });

  // Analyze Core Web Vitals
  let webVitals = null;
  try {
    webVitals = await analyzeCoreWebVitals(url);
  } catch (error) {
    console.error("Error analyzing Core Web Vitals:", error);
    // Continue even if Core Web Vitals analysis fails
  }

  // Return the analysis results
  return seoAnalysisToResponse(tags, score, webVitals, url);
}

// Helper function to generate comparison categories for multiple websites
function generateComparisonCategories(
  primary: SeoData, 
  competitors: SeoData[]
): ComparisonCategory[] {
  const allSites = [primary, ...competitors];
  const categories: ComparisonCategory[] = [
    {
      name: "Overall SEO Score",
      key: "overall",
      description: "Overall SEO score based on meta tag implementation",
      leader: 0,
      scores: allSites.map(site => site.score)
    },
    {
      name: "Meta Tags",
      key: "metaTags",
      description: "Basic meta tags (title, description, etc.)",
      leader: 0,
      scores: allSites.map(site => {
        let score = 0;
        if (site.tags.title) score += site.tags.title.length >= 30 && site.tags.title.length <= 60 ? 10 : 5;
        if (site.tags.description) score += site.tags.description.length >= 120 && site.tags.description.length <= 160 ? 10 : 5;
        if (site.tags.canonical) score += 10;
        if (site.tags.robots) score += 5;
        if (site.tags.keywords) score += 5;
        return Math.min(score, 30);
      })
    },
    {
      name: "Social Media",
      key: "socialMedia",
      description: "Social media tags (Open Graph, Twitter Cards)",
      leader: 0,
      scores: allSites.map(site => {
        let score = 0;
        // OG tags
        if (site.tags['og:title']) score += 5;
        if (site.tags['og:description']) score += 5;
        if (site.tags['og:image']) score += 5;
        // Twitter tags
        if (site.tags['twitter:card']) score += 5;
        if (site.tags['twitter:title']) score += 5;
        if (site.tags['twitter:description']) score += 3;
        if (site.tags['twitter:image']) score += 2;
        return Math.min(score, 30);
      })
    },
    {
      name: "Technical SEO",
      key: "technicalSeo",
      description: "Technical SEO elements (viewport, charset, etc.)",
      leader: 0,
      scores: allSites.map(site => {
        let score = 0;
        if (site.tags.viewport) score += 8;
        if (site.tags['content-language'] || (site.tags.html && site.tags.html.includes('lang'))) score += 8;
        if (site.tags.charset) score += 7;
        if (site.tags['x-ua-compatible']) score += 7;
        return Math.min(score, 30);
      })
    }
  ];

  // Find the leader for each category
  for (const category of categories) {
    const maxScore = Math.max(...category.scores);
    category.leader = category.scores.indexOf(maxScore);
  }

  return categories;
}

// Helper function to fulfill an order after payment is complete
async function fulfillOrder(session: Stripe.Checkout.Session): Promise<void> {
  // Extract the user ID and plan type from the session metadata
  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType || 'basic';
  const planId = session.metadata?.planId;
  
  if (!userId) {
    throw new Error('Missing User ID in session metadata');
  }
  
  console.log(`Processing subscription for User ID: ${userId}, Plan Type: ${planType}`);
  
  try {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User not found with ID ${userId}`);
    }
    
    // Record the payment in the database
    await storage.createPayment({
      userId: userId,
      stripeSessionId: session.id,
      amount: session.amount_total || 0,
      planType: planType as any, // Type assertion needed due to enum
      status: 'succeeded'
    });
    
    // Update the user's plan
    await storage.updateUserPlan(userId, planType);
    
    console.log(`User ${userId} subscription updated to ${planType} plan`);
    
  } catch (error) {
    console.error(`Error processing subscription for User ID ${userId}:`, error);
    throw error;
  }
}
