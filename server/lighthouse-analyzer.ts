import { CoreWebVitalsData, CoreWebVitalsMetric, MetricStatus } from '../shared/schema';

// Mock Core Web Vitals analyzer for development - simulates lighthouse results
// Note: This is a temporary implementation until we can properly integrate Lighthouse
export async function analyzeCoreWebVitals(url: string): Promise<CoreWebVitalsData> {
  try {
    // Simulate a network delay for a more realistic experience
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate random values in realistic ranges
    const lcpValue = Math.random() * 5000; // 0-5000ms
    const fidValue = Math.random() * 500;  // 0-500ms
    const clsValue = Math.random() * 0.4;  // 0-0.4
    
    // Create result object
    const result: CoreWebVitalsData = {
      lcp: createLCPMetric(lcpValue),
      fid: createFIDMetric(fidValue),
      cls: createCLSMetric(clsValue),
      url,
      fetchTime: new Date().toISOString()
    };

    return result;
  } catch (error) {
    console.error('Error analyzing Core Web Vitals:', error);
    throw error;
  }
}

/**
 * Creates the LCP (Largest Contentful Paint) metric object
 */
function createLCPMetric(value: number): CoreWebVitalsMetric {
  const valueInSeconds = value / 1000;
  
  // Determine status based on thresholds
  let status: MetricStatus = 'good';
  if (valueInSeconds > 2.5) status = 'needs-improvement';
  if (valueInSeconds > 4.0) status = 'poor';
  
  const improvementTips = [
    'Optimize and compress images to reduce load time',
    'Implement lazy loading for below-the-fold images',
    'Reduce server response time with better hosting or caching'
  ];
  
  if (status === 'good') {
    improvementTips.unshift('Your LCP is already good! Focus on maintaining this performance.');
  }
  
  return {
    name: 'Largest Contentful Paint',
    value: valueInSeconds,
    status,
    description: 'Measures loading performance. To provide a good user experience, sites should strive to have LCP occur within the first 2.5 seconds of the page starting to load.',
    improvementTips: status === 'good' ? [improvementTips[0]] : improvementTips
  };
}

/**
 * Creates the FID (First Input Delay) metric object
 * Note: Here we simulate the INP (Interaction to Next Paint) metric which is replacing FID
 */
function createFIDMetric(value: number): CoreWebVitalsMetric {
  const valueInMs = value;
  
  // Determine status based on thresholds
  let status: MetricStatus = 'good';
  if (valueInMs > 100) status = 'needs-improvement';
  if (valueInMs > 300) status = 'poor';
  
  const improvementTips = [
    'Break up long tasks to improve interactivity',
    'Minimize JavaScript execution time and defer non-critical JS',
    'Remove unused JavaScript and CSS to reduce bundle size'
  ];
  
  if (status === 'good') {
    improvementTips.unshift('Your Interactivity score is already good! Keep optimizing JavaScript execution.');
  }
  
  return {
    name: 'Interaction to Next Paint (INP)',
    value: valueInMs,
    status,
    description: 'Measures responsiveness. To provide a good user experience, pages should have an INP of 200 milliseconds or less.',
    improvementTips: status === 'good' ? [improvementTips[0]] : improvementTips
  };
}

/**
 * Creates the CLS (Cumulative Layout Shift) metric object
 */
function createCLSMetric(value: number): CoreWebVitalsMetric {
  // Determine status based on thresholds
  let status: MetricStatus = 'good';
  if (value > 0.1) status = 'needs-improvement';
  if (value > 0.25) status = 'poor';
  
  const improvementTips = [
    'Set explicit width and height for images and videos',
    'Avoid inserting content above existing content, except in response to user interaction',
    'Use transform animations instead of animations that trigger layout changes'
  ];
  
  if (status === 'good') {
    improvementTips.unshift('Your CLS is already good! Maintain your layout stability practices.');
  }
  
  return {
    name: 'Cumulative Layout Shift',
    value,
    status,
    description: 'Measures visual stability. To provide a good user experience, pages should maintain a CLS of less than 0.1.',
    improvementTips: status === 'good' ? [improvementTips[0]] : improvementTips
  };
}