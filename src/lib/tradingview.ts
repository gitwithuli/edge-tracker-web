/**
 * TradingView URL utilities
 *
 * Handles conversion of TradingView snapshot URLs to direct image URLs
 * and fetching images as base64 for AI processing.
 */

/**
 * Convert a TradingView snapshot URL to a direct image URL
 *
 * Input formats:
 * - https://www.tradingview.com/x/RbhFv3mG/
 * - https://tradingview.com/x/RbhFv3mG/
 * - https://www.tradingview.com/x/RbhFv3mG
 *
 * Output:
 * - https://s3.tradingview.com/snapshots/r/RbhFv3mG.png
 */
export function convertTvUrlToImageUrl(tvUrl: string): string | null {
  try {
    const url = new URL(tvUrl);

    // Check if it's a TradingView URL
    if (!url.hostname.includes('tradingview.com')) {
      return null;
    }

    // Extract the snapshot ID from the path
    // Path format: /x/RbhFv3mG/ or /x/RbhFv3mG
    const match = url.pathname.match(/\/x\/([A-Za-z0-9]+)/);
    if (!match) {
      return null;
    }

    const snapshotId = match[1];
    const firstChar = snapshotId[0].toLowerCase();

    // Construct the direct image URL
    return `https://s3.tradingview.com/snapshots/${firstChar}/${snapshotId}.png`;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is a TradingView snapshot URL
 */
export function isTradingViewUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('tradingview.com') &&
           parsedUrl.pathname.includes('/x/');
  } catch {
    return false;
  }
}

/**
 * Fetch a TradingView snapshot as base64
 */
export async function fetchTvImageAsBase64(tvUrl: string): Promise<string | null> {
  const imageUrl = convertTvUrlToImageUrl(tvUrl);
  if (!imageUrl) {
    return null;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Failed to fetch TV image:', response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error fetching TV image:', error);
    return null;
  }
}

/**
 * Validate that a base64 image is a valid image format
 */
export function validateBase64Image(base64: string): boolean {
  // Check for valid data URI prefix
  const validPrefixes = [
    'data:image/png;base64,',
    'data:image/jpeg;base64,',
    'data:image/webp;base64,',
    'data:image/gif;base64,',
  ];

  return validPrefixes.some(prefix => base64.startsWith(prefix));
}

/**
 * Get the file extension from a base64 data URI
 */
export function getImageExtensionFromBase64(base64: string): string {
  if (base64.startsWith('data:image/png')) return 'png';
  if (base64.startsWith('data:image/jpeg')) return 'jpg';
  if (base64.startsWith('data:image/webp')) return 'webp';
  if (base64.startsWith('data:image/gif')) return 'gif';
  return 'png'; // Default
}
