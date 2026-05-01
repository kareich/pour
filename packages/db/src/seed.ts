/**
 * Prisma seed entry point.
 *
 * This is a thin wrapper that delegates to the workers seed pipeline.
 * For a full seed run (all data sources), use:
 *   pnpm --filter workers run seed:all
 *
 * This script provides a minimal dev seed for local database setup.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_TREE = [
  { name: 'Whiskey', slug: 'whiskey', children: [
    { name: 'Bourbon', slug: 'bourbon' },
    { name: 'Rye', slug: 'rye' },
    { name: 'Scotch', slug: 'scotch' },
    { name: 'Irish Whiskey', slug: 'irish-whiskey' },
    { name: 'Japanese Whisky', slug: 'japanese-whisky' },
    { name: 'Canadian Whisky', slug: 'canadian-whisky' },
  ]},
  { name: 'Tequila & Mezcal', slug: 'tequila-mezcal', children: [
    { name: 'Tequila', slug: 'tequila' },
    { name: 'Mezcal', slug: 'mezcal' },
  ]},
  { name: 'Rum', slug: 'rum' },
  { name: 'Vodka', slug: 'vodka' },
  { name: 'Gin', slug: 'gin' },
  { name: 'Brandy & Cognac', slug: 'brandy-cognac', children: [
    { name: 'Cognac', slug: 'cognac' },
  ]},
  { name: 'Liqueur', slug: 'liqueur' },
];

async function seedCategories(
  cats: Array<{ name: string; slug: string; children?: Array<{ name: string; slug: string }> }>,
  parentId: string | null = null
): Promise<void> {
  for (const cat of cats) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug, parentId },
      update: { parentId },
    });
    if (cat.children?.length) {
      await seedCategories(cat.children, record.id);
    }
  }
}

async function main() {
  console.log('Running minimal dev seed...');
  await seedCategories(CATEGORY_TREE);
  console.log('Categories seeded. For full 40K+ spirits, run: pnpm --filter workers run seed:all');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
