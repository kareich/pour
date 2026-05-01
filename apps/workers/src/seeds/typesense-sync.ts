/**
 * Typesense Sync Seed
 *
 * Bulk imports all spirits from PostgreSQL into Typesense search index.
 * Run after database seeding.
 *
 * Run: pnpm --filter workers run seed:typesense
 */

import { prisma } from '@pour/db';
import Typesense from 'typesense';

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST ?? 'localhost',
      port: Number(process.env.TYPESENSE_PORT ?? (process.env.TYPESENSE_PROTOCOL === 'https' ? 443 : 8108)),
      protocol: (process.env.TYPESENSE_PROTOCOL as 'http' | 'https') ?? 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY ?? 'xyz',
  connectionTimeoutSeconds: 5,
});

const COLLECTION = 'spirits';

const schema = {
  name: COLLECTION,
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'name', type: 'string' as const },
    { name: 'distillery_name', type: 'string' as const, facet: true, optional: true },
    { name: 'category', type: 'string' as const, facet: true, optional: true },
    { name: 'subcategory', type: 'string' as const, facet: true, optional: true },
    { name: 'region', type: 'string' as const, facet: true, optional: true },
    { name: 'abv', type: 'float' as const, optional: true },
    { name: 'avg_rating', type: 'float' as const },
    { name: 'rating_count', type: 'int32' as const },
    { name: 'description', type: 'string' as const, optional: true },
    { name: 'image_url', type: 'string' as const, optional: true },
  ],
  default_sorting_field: 'avg_rating',
};

export async function syncToTypesense(): Promise<void> {
  // Recreate collection
  try {
    await client.collections(COLLECTION).delete();
    console.log('Deleted existing Typesense collection');
  } catch {
    // Collection didn't exist
  }

  await client.collections().create(schema);
  console.log('Created Typesense collection');

  const BATCH = 1000;
  let cursor = 0;
  let total = 0;

  while (true) {
    const spirits = await prisma.spirit.findMany({
      skip: cursor,
      take: BATCH,
      include: {
        distillery: { select: { name: true, region: true } },
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    if (!spirits.length) break;

    const documents = spirits.map((s) => ({
      id: s.id,
      name: s.name,
      distillery_name: s.distillery?.name ?? undefined,
      category: s.category?.name ?? undefined,
      subcategory: s.subcategory ?? undefined,
      region: s.distillery?.region ?? undefined,
      abv: s.abv ?? undefined,
      avg_rating: s.avgRating,
      rating_count: s.ratingCount,
      description: s.description ?? undefined,
      image_url: s.images[0]?.url ?? undefined,
    }));

    await client.collections(COLLECTION).documents().import(documents, { action: 'upsert' });
    cursor += spirits.length;
    total += spirits.length;
    process.stdout.write(`\rSynced: ${total}`);
  }

  console.log(`\nTypesense sync complete: ${total} spirits indexed`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncToTypesense().then(() => prisma.$disconnect()).catch(console.error);
}
