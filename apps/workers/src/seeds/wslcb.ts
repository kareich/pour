/**
 * Washington State Liquor Control Board (WSLCB) Spirits Seed
 *
 * Ingests spirits from the WSLCB price list — a public tab-delimited file
 * published monthly by Washington State.
 *
 * Download: https://www.lcb.wa.gov/licensing/spirits-price-lists
 * File format: tab-delimited, fields below
 *
 * Run: pnpm --filter workers run seed:wslcb
 */

import { parse } from 'csv-parse';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '@pour/db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// WSLCB class codes → category slug mappings
const WSLCB_CLASS_MAP: Record<string, string> = {
  'BOURBON WHISKEY': 'bourbon',
  'STRAIGHT BOURBON WHISKEY': 'bourbon',
  'TENNESSEE WHISKEY': 'tennessee-whiskey',
  'RYE WHISKEY': 'rye',
  'STRAIGHT RYE WHISKEY': 'rye',
  'SCOTCH WHISKY': 'scotch',
  'SINGLE MALT SCOTCH': 'single-malt-scotch',
  'BLENDED SCOTCH': 'blended-scotch',
  'IRISH WHISKEY': 'irish-whiskey',
  'CANADIAN WHISKY': 'canadian-whisky',
  'JAPANESE WHISKY': 'japanese-whisky',
  'AMERICAN WHISKEY': 'whiskey',
  'BLENDED WHISKEY': 'blended-whiskey',
  'CORN WHISKEY': 'corn-whiskey',
  'MALT WHISKY': 'american-single-malt',
  'TEQUILA': 'tequila',
  'MEZCAL': 'mezcal',
  'RUM': 'rum',
  'VODKA': 'vodka',
  'GIN': 'gin',
  'BRANDY': 'american-brandy',
  'COGNAC': 'cognac',
  'ARMAGNAC': 'armagnac',
};

interface WSLCBRow {
  DESCRIPTION: string;
  BRAND_NAME: string;
  PROOF: string;
  SIZE: string;
  PRICE: string;
  COST: string;
  LIQUOR_TYPE: string;
  TRAVEL_ZONE: string;
  UPC_CODE?: string;
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

function proofToAbv(proof: string): number | null {
  const num = parseFloat(proof);
  if (isNaN(num) || num < 1 || num > 200) return null;
  return Math.round((num / 2) * 10) / 10;
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

async function getCategoryId(liquorType: string): Promise<string | null> {
  const upper = liquorType.toUpperCase().trim();
  const slug = WSLCB_CLASS_MAP[upper];
  if (!slug) return null;
  const cat = await prisma.category.findUnique({ where: { slug } });
  return cat?.id ?? null;
}

export async function seedFromWSLCB(tsvPath: string): Promise<void> {
  if (!existsSync(tsvPath)) {
    console.log(`WSLCB price list not found at ${tsvPath}`);
    console.log('Download from: https://www.lcb.wa.gov/licensing/spirits-price-lists');
    console.log('Save the tab-delimited file to data/wslcb-price-list.tsv');
    return;
  }

  const categoryCache = new Map<string, string | null>();
  let inserted = 0;
  let skipped = 0;
  let barcodesLinked = 0;

  const parser = parse({
    columns: true,
    trim: true,
    skip_empty_lines: true,
    delimiter: '\t',
    relax_column_count: true,
  });

  parser.on('data', async (row: WSLCBRow) => {
    const rawName = normalizeName(row.DESCRIPTION ?? row.BRAND_NAME ?? '');
    if (!rawName || rawName.length < 2) return;

    const slug = slugify(rawName);
    if (!slug) return;

    const liquorType = (row.LIQUOR_TYPE ?? '').toUpperCase().trim();
    const abv = proofToAbv(row.PROOF ?? '');

    parser.pause();
    try {
      let categoryId: string | null = null;
      if (liquorType) {
        if (!categoryCache.has(liquorType)) {
          categoryCache.set(liquorType, await getCategoryId(liquorType));
        }
        categoryId = categoryCache.get(liquorType) ?? null;
      }

      const spirit = await prisma.spirit.upsert({
        where: { slug },
        create: { name: rawName, slug, categoryId, abv },
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
    } catch {
      skipped++;
    }
    parser.resume();

    if ((inserted + skipped) % 500 === 0) {
      process.stdout.write(`\rInserted: ${inserted} | Skipped: ${skipped} | Barcodes: ${barcodesLinked}`);
    }
  });

  await new Promise((resolve, reject) => {
    createReadStream(tsvPath).pipe(parser).on('finish', resolve).on('error', reject);
  });

  console.log(`\nWSLCB seed complete: ${inserted} spirits, ${barcodesLinked} barcodes, ${skipped} skipped`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const tsvPath = process.argv[2] ?? path.join(__dirname, '../../../../data/wslcb-price-list.tsv');
  seedFromWSLCB(tsvPath).then(() => prisma.$disconnect()).catch(console.error);
}
