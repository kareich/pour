/**
 * Open Food Facts Spirits Seed
 *
 * Imports spirit barcodes from the Open Food Facts open database.
 * Focuses on spirits category with EAN-13/UPC barcodes.
 *
 * Run: pnpm --filter workers run seed:openfoodfacts
 */

import { parse } from 'csv-parse';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '@pour/db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface OFFRow {
  code: string;
  product_name: string;
  categories_en: string;
  quantity: string;
  brands: string;
  image_front_url: string;
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

function isValidBarcode(code: string): boolean {
  if (code.length === 13) return validateEAN13(code);
  return code.length >= 8; // shorter codes (UPC-E, ISBN-like) accepted as-is
}

function isSpiritCategory(categories: string): boolean {
  const lower = categories.toLowerCase();
  return (
    lower.includes('spirits') ||
    lower.includes('whisky') ||
    lower.includes('whiskey') ||
    lower.includes('bourbon') ||
    lower.includes('tequila') ||
    lower.includes('rum') ||
    lower.includes('vodka') ||
    lower.includes('gin') ||
    lower.includes('brandy') ||
    lower.includes('cognac') ||
    lower.includes('mezcal')
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function seedFromOpenFoodFacts(csvPath: string): Promise<void> {
  if (!existsSync(csvPath)) {
    console.log(`Open Food Facts CSV not found at ${csvPath}`);
    console.log('Download from: https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv');
    return;
  }

  let processed = 0;
  let linked = 0;
  let newSpirits = 0;

  const parser = parse({
    columns: true,
    trim: true,
    skip_empty_lines: true,
    delimiter: '\t',
    relax_column_count: true,
  });

  parser.on('data', async (row: OFFRow) => {
    if (!isSpiritCategory(row.categories_en ?? '')) return;

    const barcode = normalizeBarcode(row.code ?? '');
    if (!barcode || !isValidBarcode(barcode)) return;

    const productName = (row.product_name ?? '').trim().substring(0, 255);
    if (!productName) return;

    processed++;

    parser.pause();
    try {
      // Check if barcode already linked
      const existing = await prisma.spiritBarcode.findUnique({ where: { barcode } });
      if (existing) {
        parser.resume();
        return;
      }

      // Try to find matching spirit by name
      let spirit = await prisma.spirit.findFirst({
        where: { name: { contains: productName.substring(0, 30), mode: 'insensitive' } },
        select: { id: true },
      });

      // Create new spirit record if not found
      if (!spirit) {
        const slug = slugify(productName);
        if (!slug) {
          parser.resume();
          return;
        }
        try {
          spirit = await prisma.spirit.create({
            data: { name: productName, slug: `${slug}-off` },
          });
          newSpirits++;
        } catch {
          // Slug conflict — append barcode suffix
          spirit = await prisma.spirit.upsert({
            where: { slug: `${slug}-${barcode.slice(-4)}` },
            create: { name: productName, slug: `${slug}-${barcode.slice(-4)}` },
            update: {},
          });
        }
      }

      await prisma.spiritBarcode.create({
        data: { spiritId: spirit.id, barcode, barcodeType: barcode.length === 13 ? 'EAN13' : 'UPC_A' },
      }).catch(() => {}); // ignore duplicate barcode

      linked++;
      if (row.image_front_url) {
        await prisma.spiritImage.create({
          data: { spiritId: spirit.id, url: row.image_front_url, isPrimary: true, source: 'openfoodfacts' },
        }).catch(() => {});
      }
    } catch (err) {
      // Non-fatal
    }
    parser.resume();

    if (processed % 1000 === 0) {
      process.stdout.write(`\rProcessed: ${processed} | Linked: ${linked} | New spirits: ${newSpirits}`);
    }
  });

  await new Promise((resolve, reject) => {
    createReadStream(csvPath).pipe(parser).on('finish', resolve).on('error', reject);
  });

  console.log(`\nOpen Food Facts seed: ${processed} spirits processed, ${linked} barcodes linked, ${newSpirits} new spirits`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const csvPath = process.argv[2] ?? path.join(__dirname, '../../../../data/openfoodfacts.csv');
  seedFromOpenFoodFacts(csvPath).then(() => prisma.$disconnect()).catch(console.error);
}
