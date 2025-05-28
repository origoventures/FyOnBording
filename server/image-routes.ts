import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { 
  auditImagesFromUrl, 
  auditImagesFromPath, 
  convertImagesToWebP,
  getJobStatus
} from './image-optimizer';
import { ImageData } from '@shared/schema';
import { storage } from './storage';

const router = Router();

// Middleware to verify if the user has Teams or Enterprise plan
const checkPremiumPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    
    // Check user's subscription
    const subscription = await storage.checkUserSubscription(userId);
    
    // Get user to check plan type
    const user = await storage.getUser(userId);
    
    if (!user || !user.currentPlan) {
      return res.status(403).json({ error: 'User not found or no active plan' });
    }
    
    // Only allow premium (Teams) and enterprise plans
    if (!['premium', 'enterprise'].includes(user.currentPlan)) {
      return res.status(403).json({ 
        error: 'Feature restricted to Teams and Enterprise plans',
        code: 'PLAN_RESTRICTION'
      });
    }
    
    // Check if user has remaining usage
    if (subscription.remainingUsage <= 0) {
      return res.status(403).json({ 
        error: 'No remaining usage for this feature',
        code: 'USAGE_LIMIT'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in premium plan check middleware:', error);
    res.status(500).json({ error: 'Internal server error checking subscription' });
  }
};

// Validation schemas
const auditUrlSchema = z.object({
  url: z.string().url(),
});

const auditPathSchema = z.object({
  path: z.string().min(1),
});

const convertImagesSchema = z.object({
  images: z.array(z.object({
    src: z.string(),
    width: z.number(),
    height: z.number(),
    sizeKB: z.number(),
    format: z.string(),
    alt: z.string().nullable(),
    flags: z.array(z.enum(['OVERSIZE', 'MISSING_ALT', 'NOT_WEBP'])),
  })),
  options: z.object({
    quality: z.number().min(1).max(100).default(80),
    maxWidth: z.number().min(100).max(4000).default(1280),
  }).optional(),
});

const jobIdSchema = z.object({
  id: z.string().min(1),
});

// Audit images from a URL
router.post('/audit', checkPremiumPlan, async (req, res) => {
  try {
    // Validate request - could be a URL or a path
    const urlResult = auditUrlSchema.safeParse(req.body);
    const pathResult = auditPathSchema.safeParse(req.body);
    
    if (!urlResult.success && !pathResult.success) {
      return res.status(400).json({ 
        error: "Invalid request. Either 'url' or 'path' must be provided." 
      });
    }
    
    let auditResult;
    
    if (urlResult.success) {
      const { url } = urlResult.data;
      auditResult = await auditImagesFromUrl(url);
    } else if (pathResult.success) {
      const { path } = pathResult.data;
      auditResult = await auditImagesFromPath(path);
    }
    
    res.json(auditResult);
  } catch (err: any) {
    console.error('Error in image audit:', err);
    res.status(500).json({ error: err.message || 'Error auditing images' });
  }
});

// Convert images to WebP
router.post('/convert', checkPremiumPlan, async (req, res) => {
  try {
    // Validate request
    const result = convertImagesSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error.format() });
    }
    
    const { images, options } = result.data;
    
    // Start conversion job
    const jobId = await convertImagesToWebP(images as ImageData[], options);
    
    res.json({ jobId });
  } catch (err: any) {
    console.error('Error converting images:', err);
    res.status(500).json({ error: err.message || 'Error converting images' });
  }
});

// Get job status
router.get('/job/:id', checkPremiumPlan, async (req, res) => {
  try {
    // Validate job ID
    const result = jobIdSchema.safeParse({ id: req.params.id });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error.format() });
    }
    
    const { id } = result.data;
    const jobStatus = getJobStatus(id);
    
    if (!jobStatus) {
      return res.status(404).json({ error: `Job ${id} not found` });
    }
    
    res.json(jobStatus);
  } catch (err: any) {
    console.error('Error getting job status:', err);
    res.status(500).json({ error: err.message || 'Error getting job status' });
  }
});

export default router;