/**
 * LCBO (Liquor Control Board of Ontario) Spirits Seed
 *
 * Ingests spirits from the LCBO open product catalogue CSV.
 * LCBO publishes a full product dataset through Ontario's open data portal.
 *
 * Download: https://www.lcbo.com/en/lcbo-agent#!/category/SPIRITS
 * Open Data: https://data.ontario.ca/dataset/lcbo-product-assortment
 * CSV columns: PRODUCT_NO, PRODUCT_NAME, ORIGIN, UNIT_VOLUME, ALCOHOL_CONTENT,
 *              PRICE_IN_CENTS, LCBO_TOTAL_UNITS, PRIMARY_CATEGORY, SECONDARY_CATEGORY,
 *              TERTIARY_CATEGORY, PRODUCER_NAME, UPC_CODE, IMAGE_URL
 *
 * Run: pnpm --filter workers run seed:lcbo
 */

import { parse } from 'csv-parse';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '@pour/db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LCBO_CATEGORY_MAP: Record<string, string> = {
  'WHISKY': 'whiskey',
  'BOURBON': 'bourbon',
  'SCOTCH': 'scotch',
  'SINGLE MALT': 'single-malt-scotch',
  'IRISH': 'irish-whiskey',
  'CANADIAN WHISKY': 'canadian-whisky',
  'JAPANESE WHISKY': 'japanese-whisky',
  'RYE': 'rye',
  'TEQUILA': 'tequila',
  'MEZCAL': 'mezcal',
  'RUM': 'rum',
  'VODKA': 'vodka',
  'GIN': 'gin',
  'BRANDY': 'american-brandy',
  'COGNAC': 'cognac',
  'ARMAGNAC': 'armagnac',
  'CALVADOS': 'calvados',
  'GRAPPA': 'grappa',
  'ABSINTHE': 'absinthe',
  'LIQUEUR': 'liqueur',
  'AMARO': 'amaro',
};

interface LCBORow {
  PRODUCT_NO: string;
  PRODUCT_NAME: string;
  ORIGIN: string;
  UNIT_VOLUME: string;
  ALCOHOL_CONTENT: string;
  PRICE_IN_CENTS: string;
  PRIMARY_CATEGORY: string;
  SECONDARY_CATEGORY: string;
  TERTIARY_CATEGORY: string;
  PRODUCER_NAME: string;
  UPC_CODE: string;
  IMAGE_URL: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').substring(0, 255);
}

function parseAbv(abvStr: string): number | null {
  const num = parseFloat(abvStr);
  if (isNaN(num) || num < 0.5 || num > 100) return null;
  return num;
}

function validateEAN13(code: string): boolean {
  if (code.length !== 13 || !/^\d+$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  return ((10 - (sum % 10)) % 10) === parseInt(code[12]);
}

function normalizeBarcode(code: string): string | null {
  const clean = code.replace(/\D/g, '');
  if (clean.length === 12) {
    const ean = `0${clean}`;
    return validateEAN13(ean) ? ean : null;
  }
  if (clean.length === 13) return validateEAN13(clean) ? clean : null;
  if (clean.length >= 8) return clean;
  return null;
}

function deriveCategorySlug(row: LCBORow): string | null {
  const candidates = [
    row.TERTIARY_CATEGORY,
    row.SECONDARY_CATEGORY,
    row.PRIMARY_CATEGORY,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const upper = candidate.toUpperCase().trim();
    // Try exact match first
    if (LCBO_CATEGORY_MAP[upper]) return LCBO_CATEGORY_MAP[upper];
    // Try substring match
    for (const [key, slug] of Object.entries(LCBO_CATEGORY_MAP)) {
      if (upper.includes(key)) return slug;
    }
  }
  return null;
}

async function ensureDistillery(name: string): Promise<string> {
  const slug = slugify(name);
  const dist = await prisma.distillery.upsert({
    where: { slug },
    create: { name, slug, country: 'CA' },
    update: {},
  });
  return dist.id;
}

export async function seedFromLCBO(csvPath: string): Promise<void> {
  if (!existsSync(csvPath)) {
    console.log(`LCBO CSV not found at ${csvPath}`);
    console.log('Download from: https://data.ontario.ca/dataset/lcbo-product-assortment');
    console.log('Save as data/lcbo-products.csv');
    return;
  }

  const categoryCache = new Map<string, string | null>();
  const distilleryCache = new Map<string, string>();
  let inserted = 0;
  let skipped = 0;
  let barcodesLinked = 0;
  let imagesLinked = 0;

  const parser = parse({
    columns: true,
    trim: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  parser.on('data', async (row: LCBORow) => {
    const rawName = normalizeName(row.PRODUCT_NAME ?? '');
    if (!rawName || rawName.length < 2) return;

    // Filter to spirits only
    const primaryCat = (row.PRIMARY_CATEGORY ?? '').toUpperCase();
    if (!primaryCat.includes('SPIRIT') && !primaryCat.includes('WHISKY') &&
        !primaryCat.includes('WHISKEY') && !primaryCat.includes('RUM') &&
        !primaryCat.includes('VODKA') && !primaryCat.includes('GIN') &&
        !primaryCat.includes('TEQUILA') && !primaryCat.includes('BRANDY') &&
        !primaryCat.includes('COGNAC') && !primaryCat.includes('LIQUEUR')) {
      return;
    }

    const slug = slugify(rawName);
    if (!slug) return;

    const abv = parseAbv(row.ALCOHOL_CONTENT ?? '');
    const categorySlug = deriveCategorySlug(row);

    parser.pause();
    try {
      let categoryId: string | null = null;
      if (categorySlug) {
        if (!categoryCache.has(categorySlug)) {
          const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
          categoryCache.set(categorySlug, cat?.id ?? null);
        }
        categoryId = categoryCache.get(categorySlug) ?? null;
      }

      let distilleryId: string | null = null;
      const producerName = normalizeName(row.PRODUCER_NAME ?? '');
      if (producerName.length > 1) {
        if (!distilleryCache.has(producerName)) {
          distilleryCache.set(producerName, await ensureDistillery(producerName));
        }
        distilleryId = distilleryCache.get(producerName) ?? null;
      }

      const spirit = await prisma.spirit.upsert({
        where: { slug },
        create: { name: rawName, slug, categoryId, distilleryId, abv },
        update: {},
      });
      inserted++;

      const rawBarcode = row.UPC_CODE ?? '';
      if (rawBarcode) {
        const barcode = normalizeBarcode(rawBarcode);
        if (barcode) {
          await prisma.spiritBarcode.upsert({
            where: { barcode },
            create: {
              spiritId: spirit.id,
              barcode,
              barcodeType: barcode.length === 13 ? 'EAN13' : 'UPC_A',
            },
            update: {},
          }).then(() => barcodesLinked++).catch(() => {});
        }
      }

      const imageUrl = (row.IMAGE_URL ?? '').trim();
      if (imageUrl) {
        await prisma.spiritImage.create({
          data: { spiritId: spirit.id, url: imageUrl, isPrimary: true, source: 'lcbo' },
        }).then(() => imagesLinked++).catch(() => {});
      }
    } catch {
      skipped++;
    }
    parser.resume();

    if ((inserted + skipped) % 500 === 0) {
      process.stdout.write(
        `\rInserted: ${inserted} | Skipped: ${skipped} | Barcodes: ${barcodesLinked} | Images: ${imagesLinked}`
      );
    }
  });

  await new Promise((resolve, reject) => {
    createReadStream(csvPath).pipe(parser).on('finish', resolve).on('error', reject);
  });

  console.log(
    `\nLCBO seed complete: ${inserted} spirits, ${barcodesLinked} barcodes, ${imagesLinked} images, ${skipped} skipped`
  );
}

const csvPath = process.argv[2] ?? path.join(__dirname, '../../../../data/lcbo-products.csv');
seedFromLCBO(csvPath).then(() => prisma.$disconnect()).catch(console.error);
