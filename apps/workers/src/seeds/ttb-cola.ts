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
import { pipeline } from 'stream/promises';
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
  const batch: Array<{ name: string; slug: string; categoryId: string | null; distilleryId: string | null; abv: number | null }> = [];

  const flush = async () => {
    if (!batch.length) return;
    for (const item of batch) {
      try {
        await prisma.spirit.upsert({
          where: { slug: item.slug },
          create: item,
          update: {},
        });
        inserted++;
      } catch {
        skipped++;
      }
    }
    batch.length = 0;
    process.stdout.write(`\rInserted: ${inserted} | Skipped: ${skipped}`);
  };

  const parser = parse({ columns: true, trim: true, skip_empty_lines: true });

  parser.on('data', async (row: TTBRow) => {
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

    let categoryId: string | null = null;
    if (categoryName) {
      if (!categoryCache.has(categoryName)) {
        categoryCache.set(categoryName, await ensureCategory(categoryName));
      }
      categoryId = categoryCache.get(categoryName) ?? null;
    }

    const distilleryName = normalizeName(row['TRADE NAME'] ?? brandName);
    let distilleryId: string | null = null;
    if (distilleryName && distilleryName.length > 1) {
      if (!distilleryCache.has(distilleryName)) {
        distilleryCache.set(distilleryName, await ensureDistillery(distilleryName));
      }
      distilleryId = distilleryCache.get(distilleryName) ?? null;
    }

    batch.push({ name, slug, categoryId, distilleryId, abv });
    if (batch.length >= BATCH_SIZE) {
      parser.pause();
      await flush();
      parser.resume();
    }
  });

  await pipeline(createReadStream(csvPath), parser).catch(() => {});
  await flush();

  console.log(`\nTTB seed complete: ${inserted} inserted, ${skipped} skipped`);
}

// Run directly
const csvPath = process.argv[2] ?? path.join(__dirname, '../../../../data/ttb-cola.csv');
seedFromTTB(csvPath).then(() => prisma.$disconnect()).catch(console.error);
