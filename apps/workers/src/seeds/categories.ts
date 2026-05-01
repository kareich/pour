/**
 * Category Hierarchy Seeder
 *
 * Seeds the full spirits category tree with parent/child relationships.
 * Run this FIRST before any other seed scripts.
 *
 * Run: pnpm --filter workers run seed:categories
 */

import { prisma } from '@pour/db';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CategoryDef {
  name: string;
  children?: CategoryDef[];
}

export const CATEGORY_TREE: CategoryDef[] = [
  {
    name: 'Whiskey',
    children: [
      { name: 'Bourbon' },
      { name: 'Rye' },
      {
        name: 'Scotch',
        children: [
          { name: 'Single Malt Scotch' },
          { name: 'Blended Scotch' },
          { name: 'Single Grain Scotch' },
          { name: 'Blended Malt Scotch' },
        ],
      },
      { name: 'Irish Whiskey' },
      { name: 'Japanese Whisky' },
      { name: 'Canadian Whisky' },
      { name: 'American Single Malt' },
      { name: 'Tennessee Whiskey' },
      { name: 'Corn Whiskey' },
      { name: 'Blended Whiskey' },
      { name: 'World Whisky' },
    ],
  },
  {
    name: 'Tequila & Mezcal',
    children: [
      { name: 'Tequila' },
      { name: 'Mezcal' },
    ],
  },
  {
    name: 'Rum',
    children: [
      { name: 'White Rum' },
      { name: 'Dark Rum' },
      { name: 'Aged Rum' },
      { name: 'Spiced Rum' },
      { name: 'Rhum Agricole' },
    ],
  },
  {
    name: 'Vodka',
    children: [
      { name: 'Flavored Vodka' },
    ],
  },
  {
    name: 'Gin',
    children: [
      { name: 'London Dry Gin' },
      { name: 'New Western Gin' },
      { name: 'Old Tom Gin' },
      { name: 'Sloe Gin' },
    ],
  },
  {
    name: 'Brandy & Cognac',
    children: [
      { name: 'Cognac' },
      { name: 'Armagnac' },
      { name: 'American Brandy' },
      { name: 'Calvados' },
      { name: 'Pisco' },
      { name: 'Grappa' },
    ],
  },
  {
    name: 'Liqueur',
    children: [
      { name: 'Amaretto' },
      { name: 'Triple Sec' },
      { name: 'Coffee Liqueur' },
      { name: 'Irish Cream' },
      { name: 'Schnapps' },
      { name: 'Amaro' },
    ],
  },
  { name: 'Absinthe' },
  { name: 'Baijiu' },
  { name: 'Soju' },
  { name: 'Other Spirits' },
];

async function upsertCategory(
  def: CategoryDef,
  parentId: string | null
): Promise<string> {
  const slug = slugify(def.name);
  const cat = await prisma.category.upsert({
    where: { slug },
    create: { name: def.name, slug, parentId },
    update: { parentId },
  });
  return cat.id;
}

export async function seedCategoryTree(
  defs: CategoryDef[],
  parentId: string | null = null
): Promise<number> {
  let count = 0;
  for (const def of defs) {
    const id = await upsertCategory(def, parentId);
    count++;
    if (def.children?.length) {
      count += await seedCategoryTree(def.children, id);
    }
  }
  return count;
}

async function main() {
  console.log('Seeding category hierarchy...');
  const count = await seedCategoryTree(CATEGORY_TREE);
  console.log(`Done: ${count} categories seeded`);
}

main().then(() => prisma.$disconnect()).catch(console.error);
