import sharp from 'sharp';
import sizeOf from 'image-size';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as crypto from 'crypto';
import fg from 'fast-glob';
import { ImageAuditResult, ImageData, ImageFlag, ImageConversionJob } from '@shared/schema';

// Create optimized directory if it doesn't exist
const OPTIMIZED_DIR = path.join(process.cwd(), 'public', 'optimized');
if (!fs.existsSync(OPTIMIZED_DIR)) {
  fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
}

// Store active jobs in memory
const activeJobs = new Map<string, ImageConversionJob>();

/**
 * Generate a random job ID
 */
function generateJobId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Analyze an image to determine if it has any issues that need flagging
 */
function analyzeImage(image: ImageData): ImageData {
  const flags: ImageFlag[] = [];

  // Check for oversized images (>200KB or >2000px on the long side)
  if (image.sizeKB > 200 || Math.max(image.width, image.height) > 2000) {
    flags.push('OVERSIZE');
  }

  // Check for missing alt text (empty or less than 5 characters)
  if (!image.alt || image.alt.length < 5) {
    flags.push('MISSING_ALT');
  }

  // Check if image is not in WebP format
  if (image.format.toLowerCase() !== 'webp') {
    flags.push('NOT_WEBP');
  }

  return {
    ...image,
    flags,
  };
}

/**
 * Extract image data from a buffer
 */
async function extractImageData(
  imageBuffer: Buffer, 
  src: string, 
  alt: string | null = null
): Promise<ImageData> {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const dimensions = sizeOf(imageBuffer);
    
    const imageData: ImageData = {
      src,
      width: dimensions.width || metadata.width || 0,
      height: dimensions.height || metadata.height || 0,
      sizeKB: Math.round((imageBuffer.length / 1024) * 100) / 100,
      format: metadata.format || path.extname(src).slice(1) || 'unknown',
      alt,
      flags: [],
    };

    return analyzeImage(imageData);
  } catch (error) {
    console.error(`Error extracting image data for ${src}:`, error);
    // Return a minimal object when we can't process the image
    return {
      src,
      width: 0,
      height: 0,
      sizeKB: 0,
      format: 'unknown',
      alt,
      flags: ['OVERSIZE', 'NOT_WEBP'],
    };
  }
}

/**
 * Fetch an image from a URL
 */
async function fetchImage(imageUrl: string): Promise<Buffer | null> {
  try {
    // Remove query parameters for accurate mime type detection
    const cleanUrl = imageUrl.split('?')[0];
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'MetaMuse-SEO-Analyzer/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl}, status: ${response.status}`);
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error(`Error fetching image from ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Audit images in a website by URL
 */
export async function auditImagesFromUrl(url: string): Promise<ImageAuditResult> {
  try {
    // Fetch HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MetaMuse-SEO-Analyzer/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${url}, status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const images: ImageData[] = [];
    let totalOriginalSize = 0;

    // Extract all image elements
    const imgPromises = $('img').map(async (_, img) => {
      const src = $(img).attr('src');
      if (!src || src.startsWith('data:')) return; // Skip data URIs
      
      const alt = $(img).attr('alt') || null;
      
      // Handle relative URLs
      const absoluteSrc = new URL(src, url).toString();
      
      const imageBuffer = await fetchImage(absoluteSrc);
      if (!imageBuffer) return;
      
      const imageData = await extractImageData(imageBuffer, absoluteSrc, alt);
      images.push(imageData);
      totalOriginalSize += imageData.sizeKB;
    }).get();

    await Promise.all(imgPromises);

    return {
      images,
      totalOriginalSize,
      url,
    };
  } catch (error) {
    console.error(`Error auditing images from URL ${url}:`, error);
    return {
      images: [],
      totalOriginalSize: 0,
      url,
    };
  }
}

/**
 * Audit images in a local directory
 */
export async function auditImagesFromPath(dirPath: string): Promise<ImageAuditResult> {
  try {
    const readFile = util.promisify(fs.readFile);
    
    // Resolve path
    let resolvedPath = dirPath;
    if (!path.isAbsolute(dirPath)) {
      resolvedPath = path.join(process.cwd(), dirPath);
    }
    
    // Use fast-glob to find all image files
    const imageFiles = await fg([
      path.join(resolvedPath, '**/*.{jpg,jpeg,png,gif,webp,svg,avif}'),
    ], { onlyFiles: true });
    
    const images: ImageData[] = [];
    let totalOriginalSize = 0;
    
    // Process each image file
    for (const filePath of imageFiles) {
      try {
        const fileBuffer = await readFile(filePath);
        const relativePath = path.relative(process.cwd(), filePath);
        
        const imageData = await extractImageData(
          fileBuffer,
          '/' + relativePath.replace(/\\/g, '/'),
          null // No alt text for file system images
        );
        
        images.push(imageData);
        totalOriginalSize += imageData.sizeKB;
      } catch (err) {
        console.error(`Error processing image file ${filePath}:`, err);
      }
    }
    
    return {
      images,
      totalOriginalSize,
      path: dirPath,
    };
  } catch (error) {
    console.error(`Error auditing images from path ${dirPath}:`, error);
    return {
      images: [],
      totalOriginalSize: 0,
      path: dirPath,
    };
  }
}

/**
 * Optimize a single image to WebP format
 */
async function optimizeImage(
  image: ImageData, 
  options: { quality: number, maxWidth: number }
): Promise<ImageData> {
  try {
    const { quality, maxWidth } = options;
    
    // Skip already optimized WebP images with reasonable size
    if (
      image.format.toLowerCase() === 'webp' && 
      image.width <= maxWidth && 
      image.sizeKB <= 100
    ) {
      return {
        ...image,
        optimizedSrc: image.src,
        optimizedSizeKB: image.sizeKB,
        savingsKB: 0,
        savingsPercent: 0,
      };
    }
    
    // Fetch image if it's a URL
    let imageBuffer: Buffer;
    if (image.src.startsWith('http')) {
      const fetchedBuffer = await fetchImage(image.src);
      if (!fetchedBuffer) {
        throw new Error(`Could not fetch image: ${image.src}`);
      }
      imageBuffer = fetchedBuffer;
    } else {
      // It's a file path
      const filePath = path.join(process.cwd(), image.src.replace(/^\//, ''));
      imageBuffer = await fs.promises.readFile(filePath);
    }
    
    // Generate a unique filename for the optimized image
    const hash = crypto.createHash('md5').update(image.src).digest('hex');
    const optimizedFilename = `${hash}.webp`;
    const optimizedPath = path.join(OPTIMIZED_DIR, optimizedFilename);
    const optimizedPublicPath = `/optimized/${optimizedFilename}`;
    
    // Optimize the image with sharp
    // Calculate dimensions to maintain aspect ratio but limit max width
    let width = image.width;
    let height = image.height;
    
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * ratio);
    }
    
    await sharp(imageBuffer)
      .resize({
        width,
        height,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 6, // Higher effort = better compression but slower
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
        force: true,
      })
      .toFile(optimizedPath);
    
    // Get file size of optimized image
    const optimizedStats = await fs.promises.stat(optimizedPath);
    const optimizedSizeKB = Math.round((optimizedStats.size / 1024) * 100) / 100;
    
    // Calculate savings
    const savingsKB = Math.round((image.sizeKB - optimizedSizeKB) * 100) / 100;
    const savingsPercent = Math.round((savingsKB / image.sizeKB) * 100 * 10) / 10;
    
    return {
      ...image,
      optimizedSrc: optimizedPublicPath,
      optimizedSizeKB,
      savingsKB,
      savingsPercent,
    };
  } catch (error) {
    console.error(`Error optimizing image ${image.src}:`, error);
    return {
      ...image,
      optimizedSrc: image.src,
      optimizedSizeKB: image.sizeKB,
      savingsKB: 0,
      savingsPercent: 0,
    };
  }
}

/**
 * Start a job to convert selected images to WebP
 * This is a simple implementation without Redis/BullMQ for Replit compatibility
 */
export async function convertImagesToWebP(
  images: ImageData[],
  options: { quality?: number, maxWidth?: number } = {}
): Promise<string> {
  // Merge with default options
  const jobOptions = {
    quality: options.quality || 80,
    maxWidth: options.maxWidth || 1280,
  };
  
  // Generate a unique job ID
  const jobId = generateJobId();
  
  // Initialize job status
  const jobData: ImageConversionJob = {
    id: jobId,
    status: 'pending',
    completed: 0,
    total: images.length,
    results: [],
  };
  
  // Store the job in memory
  activeJobs.set(jobId, jobData);
  
  // Process the job in the background
  setTimeout(async () => {
    try {
      // Update job status to processing
      jobData.status = 'processing';
      activeJobs.set(jobId, { ...jobData });
      
      // Process images with limited concurrency
      const concurrency = 3;
      const results: ImageData[] = [];
      
      // Process images in batches to limit concurrency
      for (let i = 0; i < images.length; i += concurrency) {
        const batch = images.slice(i, i + concurrency);
        const batchPromises = batch.map((image: ImageData) => optimizeImage(image, jobOptions));
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Update job progress
        jobData.completed = Math.min(i + batch.length, images.length);
        jobData.results = results;
        activeJobs.set(jobId, { ...jobData });
      }
      
      // Update job status to completed
      jobData.status = 'completed';
      jobData.results = results;
      activeJobs.set(jobId, { ...jobData });
      
      console.log(`Job ${jobId} completed successfully`);
    } catch (err: any) {
      console.error(`Error processing job ${jobId}:`, err);
      
      // Update job status to failed
      jobData.status = 'failed';
      jobData.error = err.message || 'Unknown error';
      activeJobs.set(jobId, { ...jobData });
    }
  }, 0);
  
  return jobId;
}

/**
 * Get the current status of a conversion job
 */
export function getJobStatus(jobId: string): ImageConversionJob | null {
  return activeJobs.get(jobId) || null;
}