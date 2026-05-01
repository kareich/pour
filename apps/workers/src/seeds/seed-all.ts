/**
 * Master Seed Orchestration
 *
 * Runs all seeding stages in dependency order:
 *   1. Categories (hierarchy must exist before spirits are linked)
 *   2. TTB COLA (US regulatory backbone — ~200K labels, filtered to spirits)
 *   3. Open Food Facts (barcode + image overlay)
 *   4. LCBO (Canadian catalog — barcodes + images)
 *   5. WSLCB (Washington State price list — barcodes)
 *   6. Dedup (cross-source normalization pass)
 *   7. R2 image pipeline (upload external URLs to Cloudflare R2)
 *   8. Typesense sync (rebuild search index)
 *
 * Data files must be downloaded before running. See individual seed scripts
 * for download instructions. Expected at:
 *   data/ttb-cola.csv         (ttbonline.gov — COLA registry)
 *   data/openfoodfacts.csv    (world.openfoodfacts.org/data)
 *   data/lcbo-products.csv    (data.ontario.ca — LCBO product assortment)
 *   data/wslcb-price-list.tsv (lcb.wa.gov — spirits price list)
 *
 * Run: pnpm --filter workers run seed:all
 * Flags:
 *   --skip-r2          Skip Cloudflare R2 image upload
 *   --skip-typesense   Skip Typesense index rebuild
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '@pour/db';
import { seedCategoryTree, CATEGORY_TREE } from './categories.js';
import { seedFromTTB } from './ttb-cola.js';
import { seedFromOpenFoodFacts } from './open-food-facts.js';
import { seedFromLCBO } from './lcbo.js';
import { seedFromWSLCB } from './wslcb.js';
import { runDedup } from './dedup.js';
import { runR2ImagePipeline } from './r2-image-pipeline.js';
import { syncToTypesense } from './typesense-sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../../../data');

const skipR2 = process.argv.includes('--skip-r2');
const skipTypesense = process.argv.includes('--skip-typesense');

function dataPath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

async function step(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`STEP: ${name}`);
  console.log('='.repeat(60));
  try {
    await fn();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✓ ${name} completed in ${elapsed}s`);
  } catch (err) {
    console.error(`✗ ${name} failed:`, err);
    throw err;
  }
}

async function main() {
  const totalStart = Date.now();
  console.log('Pour spirits database seeding pipeline');
  console.log('Target: 40K+ spirits, 25K+ barcodes, 20K+ images');

  await step('Category hierarchy', async () => {
    const count = await seedCategoryTree(CATEGORY_TREE);
    console.log(`${count} categories seeded`);
  });

  await step('TTB COLA registry', () => seedFromTTB(dataPath('ttb-cola.csv')));

  await step('Open Food Facts (barcodes + images)', () =>
    seedFromOpenFoodFacts(dataPath('openfoodfacts.csv'))
  );

  await step('LCBO product catalogue', () => seedFromLCBO(dataPath('lcbo-products.csv')));

  await step('WSLCB price list (Washington State)', () =>
    seedFromWSLCB(dataPath('wslcb-price-list.tsv'))
  );

  await step('Cross-source deduplication', () => runDedup());

  if (!skipR2) {
    await step('Cloudflare R2 image upload', () => runR2ImagePipeline({ batchSize: 50 }));
  } else {
    console.log('\nSkipping R2 image pipeline (--skip-r2)');
  }

  if (!skipTypesense) {
    await step('Typesense search index sync', () => syncToTypesense());
  } else {
    console.log('\nSkipping Typesense sync (--skip-typesense)');
  }

  const [spiritCount, barcodeCount, imageCount, categoryCount, distilleryCount] = await Promise.all([
    prisma.spirit.count(),
    prisma.spiritBarcode.count(),
    prisma.spiritImage.count(),
    prisma.category.count(),
    prisma.distillery.count(),
  ]);

  const totalElapsed = ((Date.now() - totalStart) / 1000 / 60).toFixed(1);

  console.log(`\n${'='.repeat(60)}`);
  console.log('SEED PIPELINE COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total time:    ${totalElapsed} minutes`);
  console.log(`Spirits:       ${spiritCount.toLocaleString()}`);
  console.log(`Barcodes:      ${barcodeCount.toLocaleString()}`);
  console.log(`Images:        ${imageCount.toLocaleString()}`);
  console.log(`Categories:    ${categoryCount}`);
  console.log(`Distilleries:  ${distilleryCount.toLocaleString()}`);
  console.log('='.repeat(60));

  if (spiritCount < 40_000) {
    console.warn(`\n⚠ Target: 40K spirits — currently at ${spiritCount.toLocaleString()}.`);
    console.warn('   Check that all data files are present and valid.');
    console.warn('   OnlyDrams license (56K spirits) will close the gap significantly.');
  }
}

main().then(() => prisma.$disconnect()).catch((err) => {
  console.error(err);
  prisma.$disconnect().finally(() => process.exit(1));
});
