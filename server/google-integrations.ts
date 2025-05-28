import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { SearchConsoleMetrics, GA4Metrics, PerformanceComparison } from '@shared/schema';

// Interface for Google API credentials
interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// OAuth scopes required for our application
const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly'
];

let credentials: GoogleCredentials | null = null;
let oauth2Client: OAuth2Client | null = null;

/**
 * Get the OAuth2 client instance
 */
export function getOAuth2Client(): OAuth2Client | null {
  return oauth2Client;
}

/**
 * Initialize the Google OAuth client with provided credentials
 */
export function initializeGoogleAuth(creds: GoogleCredentials): OAuth2Client {
  credentials = creds;
  oauth2Client = new OAuth2Client(
    credentials.clientId,
    credentials.clientSecret,
    credentials.redirectUri
  );
  return oauth2Client;
}

/**
 * Generate the OAuth authorization URL
 */
export function getAuthUrl(): string {
  if (!oauth2Client) {
    throw new Error('OAuth client not initialized');
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokens(code: string): Promise<any> {
  if (!oauth2Client) {
    throw new Error('OAuth client not initialized');
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<any> {
  if (!oauth2Client) {
    throw new Error('OAuth client not initialized');
  }

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

/**
 * Revoke OAuth access
 */
export async function revokeAccess(token: string): Promise<void> {
  if (!oauth2Client) {
    throw new Error('OAuth client not initialized');
  }

  await oauth2Client.revokeToken(token);
}

/**
 * Get Search Console metrics for a specific URL
 */
export async function getSearchConsoleMetrics(
  url: string,
  startDate: string,
  endDate: string,
  accessToken: string
): Promise<SearchConsoleMetrics> {
  if (!oauth2Client) {
    throw new Error('OAuth client not initialized');
  }

  console.log(`Fetching Search Console metrics for URL: ${url}, dates: ${startDate} to ${endDate}`);

  try {
    // Set the access token
    oauth2Client.setCredentials({ access_token: accessToken });

    // Initialize the Search Console API
    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client
    });

    // Determine site origin and clean URL
    const siteOrigin = new URL(url).origin;
    console.log(`Search Console API initialized, making query for site: ${siteOrigin}`);

    // First, let's try to get a list of all sites this user has access to
    try {
      const sitesList = await searchconsole.sites.list();
      console.log("Available sites in Search Console:", sitesList.data.siteEntry?.map(site => site.siteUrl) || []);
      
      // Check if our domain is in the list
      const hasSite = sitesList.data.siteEntry?.some(site => 
        site.siteUrl === siteOrigin || 
        site.siteUrl === siteOrigin + '/' ||
        site.siteUrl === 'sc-domain:' + new URL(url).hostname);
      
      if (!hasSite) {
        console.error(`The user does not have access to ${siteOrigin} in Search Console`);
        throw new Error(`Account fulvio@fylle.ai does not have access to ${siteOrigin} in Search Console. Please verify permissions.`);
      }
    } catch (e) {
      console.error("Error checking available sites:", e);
      // Continue anyway, as the sites.list might fail for other reasons
    }

    // Get performance data for the URL
    const response = await searchconsole.searchanalytics.query({
      siteUrl: siteOrigin,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                expression: url,
                operator: 'equals'
              }
            ]
          }
        ],
        rowLimit: 1
      }
    });

    console.log(`Search Console API response received:`, response.status, response.statusText);

    // Process the response data
    if (response.data.rows && response.data.rows.length > 0) {
      const row = response.data.rows[0];
      return {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
        startDate,
        endDate
      };
    }

    console.log(`No data returned from Search Console for URL: ${url}`);

    // Return default values if no data available
    return {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
      startDate,
      endDate
    };
  } catch (error) {
    console.error('Error in getSearchConsoleMetrics:', error);
    throw error;
  }
}

/**
 * Get Google Analytics 4 metrics for a specific URL
 */
export async function getGA4Metrics(
  url: string,
  startDate: string,
  endDate: string,
  propertyId: string,
  accessToken: string
): Promise<GA4Metrics> {
  if (!oauth2Client) {
    throw new Error('OAuth client not initialized');
  }

  console.log(`Fetching GA4 metrics for URL: ${url}, dates: ${startDate} to ${endDate}, propertyId: ${propertyId}`);

  try {
    // Set the access token
    oauth2Client.setCredentials({ access_token: accessToken });

    // Initialize the GA4 API
    const analyticsDataClient = new google.analyticsdata.v1beta.BetaAnalyticsDataClient({
      auth: oauth2Client
    });

    console.log(`GA4 API client initialized, making query for property: properties/${propertyId}`);

    // First check if the property is accessible to this user
    try {
      // Get the list of GA4 properties the user has access to
      const [properties] = await analyticsDataClient.listProperties();
      console.log("Available GA4 properties:", properties.map(prop => `${prop.displayName} (${prop.name})`));
      
      // Check if our propertyId is in the list
      const hasProperty = properties.some(prop => 
        prop.name === `properties/${propertyId}` || 
        prop.name?.includes(propertyId));
      
      if (!hasProperty) {
        console.error(`The user does not have access to GA4 property ID: ${propertyId}`);
        throw new Error(`Account fulvio@fylle.ai does not have access to GA4 property ID: ${propertyId}. Please verify permissions.`);
      }
    } catch (e) {
      console.error("Error checking available GA4 properties:", e);
      // Continue anyway as this might fail for other reasons
    }

    // Get the path portion of the URL
    const path = new URL(url).pathname;
    console.log(`Querying for path: ${path}`);

    // Run the report
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate
        }
      ],
      dimensions: [
        {
          name: 'pagePath'
        }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'EXACT',
            value: path
          }
        }
      },
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ]
    });

    console.log(`GA4 API response received, rows: ${response.rows?.length || 0}`);

    // Process the response
    if (response.rows && response.rows.length > 0) {
      const row = response.rows[0];
      const [sessions, users, pageviews, bounceRate, avgSessionDuration] = 
        row.metricValues?.map(v => Number(v.value)) || [0, 0, 0, 0, 0];

      console.log(`GA4 data processed successfully: Sessions: ${sessions}, Users: ${users}, Pageviews: ${pageviews}`);

      return {
        sessions,
        users,
        pageviews,
        bounceRate,
        avgSessionDuration,
        startDate,
        endDate
      };
    }

    console.log(`No data returned from GA4 for URL: ${url}`);

    // Return default values if no data available
    return {
      sessions: 0,
      users: 0,
      pageviews: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
      startDate,
      endDate
    };
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error";
    console.error('Error fetching GA4 data:', errorMessage, error);
    
    // Instead of returning default values, throw the error so it can be handled
    // by the calling function
    throw error;
  }
}

/**
 * Compare current performance with a previous period
 */
export async function getPerformanceComparison(
  url: string,
  currentMetrics: SearchConsoleMetrics,
  accessToken: string
): Promise<PerformanceComparison> {
  if (!oauth2Client) {
    throw new Error('OAuth client not initialized');
  }

  // Calculate the previous period dates
  const currentStartDate = new Date(currentMetrics.startDate);
  const currentEndDate = new Date(currentMetrics.endDate);
  const daysDifference = Math.round((currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const previousEndDate = new Date(currentStartDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - daysDifference);
  
  // Format dates
  const prevStartFormatted = previousStartDate.toISOString().split('T')[0];
  const prevEndFormatted = previousEndDate.toISOString().split('T')[0];

  // Get metrics for the previous period
  const previousMetrics = await getSearchConsoleMetrics(
    url,
    prevStartFormatted,
    prevEndFormatted,
    accessToken
  );

  // Calculate the differences
  return {
    ctrDifference: calculatePercentageDifference(previousMetrics.ctr, currentMetrics.ctr),
    positionDifference: previousMetrics.position - currentMetrics.position, // Lower is better for position
    impressionsDifference: calculatePercentageDifference(previousMetrics.impressions, currentMetrics.impressions)
  };
}

/**
 * Calculate percentage difference between two values
 */
function calculatePercentageDifference(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}