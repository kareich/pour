/**
 * TTB COLA Registry Seed
 *
 * Downloads and ingests spirits from the TTB COLA (Certificate of Label Approval) registry.
 * Source: https://www.ttb.gov/public-data/cola-registry
 *
 * Run: pnpm --filter workers run seed:ttb
 */

import { parse } from 'csv-parse';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '@pour/db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TTB class codes → our category names
const TTB_CLASS_MAP: Record<string, string> = {
  'BOURBON WHISKY': 'Bourbon',
  'TENNESSEE WHISKY': 'Bourbon',
  'STRAIGHT BOURBON WHISKY': 'Bourbon',
  'BLENDED WHISKY': 'Blended Whiskey',
  'SCOTCH WHISKY': 'Scotch',
  'BLENDED SCOTCH WHISKY': 'Scotch',
  'SINGLE MALT SCOTCH WHISKY': 'Scotch',
  'IRISH WHISKY': 'Irish Whiskey',
  'CANADIAN WHISKY': 'Canadian Whisky',
  'JAPANESE WHISKY': 'Japanese Whisky',
  'CORN WHISKY': 'Corn Whiskey',
  'RYE WHISKY': 'Rye',
  'STRAIGHT RYE WHISKY': 'Rye',
  'MALT WHISKY': 'American Single Malt',
  'TEQUILA': 'Tequila',
  'MEZCAL': 'Mezcal',
  'RUM': 'Rum',
  'VODKA': 'Vodka',
  'GIN': 'Gin',
  'BRANDY': 'Brandy',
  'COGNAC': 'Cognac',
  'WHISKY': 'Whiskey',
  'WHISKEY': 'Whiskey',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/['"]/g, '')
    .substring(0, 255);
}

function parseAbv(abvStr: string): number | null {
  const num = parseFloat(abvStr);
  if (isNaN(num) || num < 0.5 || num > 100) return null;
  return num;
}

interface TTBRow {
  'BRAND NAME': string;
  'TRADE NAME': string;
  'CLASS/TYPE': string;
  'ALCOHOL CONTENT': string;
  'ORIGIN': string;
  'FANCIFUL NAME': string;
}

interface PendingRow {
  name: string;
  slug: string;
  categoryName: string | null;
  distilleryName: string | null;
  abv: number | null;
}

async function ensureCategory(name: string): Promise<string> {
  const slug = slugify(name);
  const cat = await prisma.category.upsert({
    where: { slug },
    create: { name, slug },
    update: {},
  });
  return cat.id;
}

async function ensureDistillery(name: string): Promise<string> {
  const slug = slugify(name);
  const dist = await prisma.distillery.upsert({
    where: { slug },
    create: { name, slug },
    update: {},
  });
  return dist.id;
}

export async function seedFromTTB(csvPath: string): Promise<void> {
  if (!existsSync(csvPath)) {
    console.log(`TTB CSV not found at ${csvPath}. Download from ttb.gov/public-data/cola-registry`);
    console.log('Skipping TTB seed. Run: npm run seed:ttb -- --download to auto-download.');
    return;
  }

  const categoryCache = new Map<string, string>();
  const distilleryCache = new Map<string, string>();
  let inserted = 0;
  let skipped = 0;
  const BATCH_SIZE = 500;

  async function processBatch(rows: PendingRow[]): Promise<void> {
    for (const item of rows) {
      let categoryId: string | null = null;
      if (item.categoryName) {
        if (!categoryCache.has(item.categoryName)) {
          categoryCache.set(item.categoryName, await ensureCategory(item.categoryName));
        }
        categoryId = categoryCache.get(item.categoryName) ?? null;
      }

      let distilleryId: string | null = null;
      if (item.distilleryName && item.distilleryName.length > 1) {
        if (!distilleryCache.has(item.distilleryName)) {
          distilleryCache.set(item.distilleryName, await ensureDistillery(item.distilleryName));
        }
        distilleryId = distilleryCache.get(item.distilleryName) ?? null;
      }

      try {
        await prisma.spirit.upsert({
          where: { slug: item.slug },
          create: { name: item.name, slug: item.slug, categoryId, distilleryId, abv: item.abv },
          update: {},
        });
        inserted++;
      } catch {
        skipped++;
      }
    }
    process.stdout.write(`\rInserted: ${inserted} | Skipped: ${skipped}`);
  }

  const pending: PendingRow[] = [];
  const parser = parse({ columns: true, trim: true, skip_empty_lines: true });

  // Collect rows synchronously; pause and flush async when batch is full.
  // Using a sync data handler avoids concurrent async handlers racing over shared state.
  parser.on('data', (row: TTBRow) => {
    const brandName = normalizeName(row['BRAND NAME'] ?? '');
    const fancifulName = normalizeName(row['FANCIFUL NAME'] ?? '');
    const rawName = fancifulName || brandName;
    if (!rawName || rawName.length < 2) return;

    const name = fancifulName ? `${brandName} ${fancifulName}`.trim() : brandName;
    const slug = slugify(name);
    if (!slug) return;

    const classType = (row['CLASS/TYPE'] ?? '').toUpperCase().trim();
    const categoryName = TTB_CLASS_MAP[classType] ?? null;
    const abv = parseAbv(row['ALCOHOL CONTENT'] ?? '');
    const distilleryName = normalizeName(row['TRADE NAME'] ?? brandName);

    pending.push({ name, slug, categoryName, distilleryName: distilleryName.length > 1 ? distilleryName : null, abv });

    if (pending.length >= BATCH_SIZE) {
      const batch = pending.splice(0);
      parser.pause();
      processBatch(batch).then(() => parser.resume()).catch(() => parser.resume());
    }
  });

  await new Promise<void>((resolve, reject) => {
    createReadStream(csvPath).pipe(parser).on('finish', resolve).on('error', reject);
  });

  // Flush remaining rows after stream ends
  if (pending.length) await processBatch(pending.splice(0));

  console.log(`\nTTB seed complete: ${inserted} inserted, ${skipped} skipped`);
}

// Run directly
const csvPath = process.argv[2] ?? path.join(__dirname, '../../../../data/ttb-cola.csv');
seedFromTTB(csvPath).then(() => prisma.$disconnect()).catch(console.error);
