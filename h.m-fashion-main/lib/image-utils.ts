/**
 * Normalize external image URLs for bandwidth-efficient delivery.
 * Pexels supports on-the-fly resize via query params; Next/Image further optimizes when enabled.
 */
export function optimizeImageUrl(url: string, width = 800, quality = 75): string {
  if (!url) return url;

  try {
    const parsed = new URL(url);

    if (parsed.hostname === 'images.pexels.com') {
      parsed.searchParams.set('auto', 'compress');
      parsed.searchParams.set('cs', 'tinysrgb');
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(quality));
      return parsed.toString();
    }
  } catch {
    // fall through
  }

  return url;
}

/** Preset widths for common UI slots */
export const IMAGE_WIDTHS = {
  thumb: 256,
  card: 480,
  category: 400,
  hero: 1400,
  avatar: 96,
  social: 320,
} as const;
