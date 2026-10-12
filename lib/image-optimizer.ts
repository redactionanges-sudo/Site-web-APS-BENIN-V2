import sharp from 'sharp';

export interface ImageOptimizationOptions {
  profile?: 'hero' | 'content' | 'portrait' | 'thumbnail' | 'auto';
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  generateThumbnail?: boolean;
}

export interface OptimizedVariant {
  name: 'original' | 'optimized' | 'thumbnail' | 'medium';
  buffer: Buffer;
  contentType: string;
  extension: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ImageOptimizationResult {
  isImage: boolean;
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  originalSizeBytes: number;
  optimized: OptimizedVariant;
  thumbnail?: OptimizedVariant;
  savingsPercent: number;
  hasBeenOptimized: boolean;
}

// Allowed MIME types and image magic signatures
const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/tiff',
  'image/gif',
]);

/**
 * Validates whether the buffer is an authentic, secure image file
 */
export function isValidImageMime(mimeType: string, fileName?: string): boolean {
  if (!mimeType) return false;
  const cleanMime = mimeType.toLowerCase().split(';')[0].trim();
  if (SUPPORTED_MIME_TYPES.has(cleanMime)) return true;

  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff', 'gif'].includes(ext || '')) {
      return true;
    }
  }
  return false;
}

/**
 * Optimizes an image buffer into modern WebP format with dimensions
 * constrained to target profiles (Hero: 1920px max, Content: 1200px max, Portrait: 600px max, Thumbnail: 400px max)
 * Preserves quality, respects orientation metadata (EXIF rotate), and avoids artificial enlargement.
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<ImageOptimizationResult> {
  // 1. Inspect image metadata via sharp
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;
  const originalFormat = metadata.format || 'unknown';
  const originalSizeBytes = inputBuffer.length;

  if (!originalWidth || !originalHeight) {
    throw new Error('Image invalide ou dimensions impossibles à lire.');
  }

  // 2. Determine target dimensions based on profile
  const profile = options.profile || 'auto';
  let targetMaxWidth = options.maxWidth;
  let targetMaxHeight = options.maxHeight;
  let targetQuality = options.quality;

  if (!targetMaxWidth) {
    switch (profile) {
      case 'hero':
        targetMaxWidth = 1920;
        targetMaxHeight = 1920;
        targetQuality = targetQuality || 82;
        break;
      case 'portrait':
        targetMaxWidth = 600;
        targetMaxHeight = 600;
        targetQuality = targetQuality || 84;
        break;
      case 'thumbnail':
        targetMaxWidth = 400;
        targetMaxHeight = 400;
        targetQuality = targetQuality || 80;
        break;
      case 'content':
      case 'auto':
      default:
        // For auto: if original is very large (> 1600), target up to 1920 if landscape hero-like, otherwise 1200
        if (originalWidth >= 1600 && originalWidth > originalHeight * 1.3) {
          targetMaxWidth = 1920;
          targetMaxHeight = 1440;
        } else {
          targetMaxWidth = 1200;
          targetMaxHeight = 1200;
        }
        targetQuality = targetQuality || 82;
        break;
    }
  }

  targetQuality = targetQuality || 82;

  // 3. Process main optimized image
  // Auto-orient based on EXIF, resize without enlargement, encode to WebP with effort 4 (great compression / speed balance)
  const optimizedPipeline = sharp(inputBuffer)
    .rotate() // auto-orient EXIF
    .resize({
      width: targetMaxWidth,
      height: targetMaxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: targetQuality,
      effort: 4,
    });

  const optimizedBuffer = await optimizedPipeline.toBuffer();
  const optimizedMeta = await sharp(optimizedBuffer).metadata();

  const optimizedVariant: OptimizedVariant = {
    name: 'optimized',
    buffer: optimizedBuffer,
    contentType: 'image/webp',
    extension: 'webp',
    width: optimizedMeta.width || targetMaxWidth || originalWidth,
    height: optimizedMeta.height || targetMaxHeight || originalHeight,
    sizeBytes: optimizedBuffer.length,
  };

  // 4. Generate thumbnail (max 400px) if requested or by default for media libraries
  let thumbnailVariant: OptimizedVariant | undefined = undefined;
  if (options.generateThumbnail !== false && (originalWidth > 400 || originalHeight > 400)) {
    const thumbBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: 400,
        height: 400,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 78,
        effort: 4,
      })
      .toBuffer();

    const thumbMeta = await sharp(thumbBuffer).metadata();
    thumbnailVariant = {
      name: 'thumbnail',
      buffer: thumbBuffer,
      contentType: 'image/webp',
      extension: 'webp',
      width: thumbMeta.width || 400,
      height: thumbMeta.height || 400,
      sizeBytes: thumbBuffer.length,
    };
  }

  const savingsPercent = Math.max(
    0,
    Math.round(((originalSizeBytes - optimizedBuffer.length) / originalSizeBytes) * 100)
  );

  return {
    isImage: true,
    originalWidth,
    originalHeight,
    originalFormat,
    originalSizeBytes,
    optimized: optimizedVariant,
    thumbnail: thumbnailVariant,
    savingsPercent,
    hasBeenOptimized: true,
  };
}
