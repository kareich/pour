/**
 * Cloudflare R2 Image Pipeline
 *
 * Downloads external spirit images (from openfoodfacts, lcbo, etc.) and
 * re-uploads them to Cloudflare R2, then updates the DB with the CDN URL.
 *
 * Required env vars:
 *   CLOUDFLARE_R2_ACCOUNT_ID
 *   CLOUDFLARE_R2_ACCESS_KEY_ID
 *   CLOUDFLARE_R2_SECRET_ACCESS_KEY
 *   CLOUDFLARE_R2_BUCKET   (default: pour-images)
 *   CLOUDFLARE_CDN_URL     (e.g. https://images.getpour.app)
 *
 * Run: pnpm --filter workers run seed:images
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@pour/db';

const ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? '';
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET ?? 'pour-images';
const CDN_URL = process.env.CLOUDFLARE_CDN_URL ?? `https://pub-${ACCOUNT_ID}.r2.dev`;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
  },
});

async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PourApp/1.0 (+https://getpour.app)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) return null; // skip tiny/broken images
    return { buffer, contentType };
  } catch {
    return null;
  }
}

function r2KeyForImage(spiritId: string, imageId: string, contentType: string): string {
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  return `spirits/${spiritId}/${imageId}.${ext}`;
}

export async function runR2ImagePipeline(options: { batchSize?: number; dryRun?: boolean } = {}): Promise<void> {
  const { batchSize = 50, dryRun = false } = options;

  if (!ACCOUNT_ID) {
    console.error('CLOUDFLARE_R2_ACCOUNT_ID not set. Skipping image pipeline.');
    return;
  }

  const total = await prisma.spiritImage.count({
    where: { source: { not: 'r2' }, url: { not: { startsWith: CDN_URL } } },
  });
  console.log(`Found ${total} images to migrate to R2`);
  if (dryRun) { console.log('Dry run mode — no uploads'); return; }

  let processed = 0;
  let uploaded = 0;
  let failed = 0;
  let cursor: string | undefined;

  while (true) {
    const images = await prisma.spiritImage.findMany({
      where: {
        source: { not: 'r2' },
        url: { not: { startsWith: CDN_URL } },
      },
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
    });

    if (!images.length) break;
    cursor = images[images.length - 1].id;

    for (const img of images) {
      processed++;
      const key = r2KeyForImage(img.spiritId, img.id, 'image/jpeg');

      const alreadyUploaded = await objectExists(key);
      if (!alreadyUploaded) {
        const fetched = await fetchImageBuffer(img.url);
        if (!fetched) {
          failed++;
          continue;
        }

        const actualKey = r2KeyForImage(img.spiritId, img.id, fetched.contentType);
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: actualKey,
          Body: fetched.buffer,
          ContentType: fetched.contentType,
          CacheControl: 'public, max-age=31536000, immutable',
          Metadata: { source: img.source ?? 'unknown', spirit_id: img.spiritId },
        }));

        const cdnUrl = `${CDN_URL}/${actualKey}`;
        await prisma.spiritImage.update({
          where: { id: img.id },
          data: { url: cdnUrl, source: 'r2' },
        });
        uploaded++;
      } else {
        // Already on R2, update URL
        await prisma.spiritImage.update({
          where: { id: img.id },
          data: { url: `${CDN_URL}/${key}`, source: 'r2' },
        });
        uploaded++;
      }

      if (processed % 10 === 0) {
        process.stdout.write(`\rProcessed: ${processed}/${total} | Uploaded: ${uploaded} | Failed: ${failed}`);
      }
    }
  }

  console.log(`\nR2 image pipeline complete: ${uploaded} uploaded, ${failed} failed`);
}

const dryRun = process.argv.includes('--dry-run');
runR2ImagePipeline({ dryRun }).then(() => prisma.$disconnect()).catch(console.error);
