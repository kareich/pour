/**
 * Cross-Source Deduplication
 *
 * Merges duplicate spirit records that arise from multiple seed sources.
 * Duplicates are identified by:
 *   1. Slug collision (exact match after normalization)
 *   2. Near-name match (same first 30 chars, case-insensitive)
 *
 * For each duplicate group, keeps the record with the most data (barcodes,
 * images, attributes, abv, description) and merges child records onto it.
 *
 * Run: pnpm --filter workers run seed:dedup
 */

import { prisma } from '@pour/db';

function scoreSpiritCompleteness(spirit: {
  abv: number | null;
  description: string | null;
  categoryId: string | null;
  distilleryId: string | null;
  ageStatement: number | null;
}): number {
  let score = 0;
  if (spirit.abv) score += 2;
  if (spirit.description) score += 3;
  if (spirit.categoryId) score += 2;
  if (spirit.distilleryId) score += 2;
  if (spirit.ageStatement) score += 1;
  return score;
}

async function mergeInto(canonicalId: string, duplicateId: string): Promise<void> {
  // Reassign barcodes (ignore conflicts — canonical may already have the barcode)
  const barcodes = await prisma.spiritBarcode.findMany({ where: { spiritId: duplicateId } });
  for (const b of barcodes) {
    await prisma.spiritBarcode.updateMany({
      where: { id: b.id, barcode: b.barcode },
      data: { spiritId: canonicalId },
    }).catch(() => {}); // ignore unique constraint violations
  }

  // Reassign images
  await prisma.spiritImage.updateMany({
    where: { spiritId: duplicateId },
    data: { spiritId: canonicalId },
  }).catch(() => {});

  // Reassign attributes (ignore conflicts on unique spiritId+key)
  const attrs = await prisma.spiritAttribute.findMany({ where: { spiritId: duplicateId } });
  for (const a of attrs) {
    await prisma.spiritAttribute.upsert({
      where: { spiritId_key: { spiritId: canonicalId, key: a.key } },
      create: { spiritId: canonicalId, key: a.key, value: a.value },
      update: {},
    }).catch(() => {});
  }

  // Reassign ratings/reviews/collections/wishlists
  await prisma.rating.updateMany({ where: { spiritId: duplicateId }, data: { spiritId: canonicalId } }).catch(() => {});
  await prisma.review.updateMany({ where: { spiritId: duplicateId }, data: { spiritId: canonicalId } }).catch(() => {});
  await prisma.collectionEntry.updateMany({ where: { spiritId: duplicateId }, data: { spiritId: canonicalId } }).catch(() => {});
  await prisma.wishlistEntry.updateMany({ where: { spiritId: duplicateId }, data: { spiritId: canonicalId } }).catch(() => {});
  await prisma.priceSnapshot.updateMany({ where: { spiritId: duplicateId }, data: { spiritId: canonicalId } }).catch(() => {});

  // Merge metadata onto canonical if it's missing
  const dup = await prisma.spirit.findUnique({ where: { id: duplicateId } });
  if (dup) {
    await prisma.spirit.update({
      where: { id: canonicalId },
      data: {
        abv: dup.abv ?? undefined,
        description: dup.description ?? undefined,
        categoryId: dup.categoryId ?? undefined,
        distilleryId: dup.distilleryId ?? undefined,
        ageStatement: dup.ageStatement ?? undefined,
      },
    });
  }

  await prisma.spirit.delete({ where: { id: duplicateId } }).catch(() => {});
}

async function deduplicateBySlugSuffix(): Promise<number> {
  // Find spirits with slugs ending in -off or -NNNN (added by open-food-facts to avoid collisions)
  const suffixedSpirits = await prisma.spirit.findMany({
    where: {
      OR: [
        { slug: { endsWith: '-off' } },
        // Match 4-digit barcode suffix pattern
        { slug: { contains: '-' } },
      ],
    },
    select: { id: true, slug: true, name: true, abv: true, description: true, categoryId: true, distilleryId: true, ageStatement: true },
  });

  let merged = 0;
  for (const spirit of suffixedSpirits) {
    // Strip known suffixes to find canonical slug
    const baseSlug = spirit.slug
      .replace(/-off$/, '')
      .replace(/-\d{4}$/, '');

    if (baseSlug === spirit.slug) continue;

    const canonical = await prisma.spirit.findUnique({ where: { slug: baseSlug } });
    if (!canonical) continue;

    // Pick the more complete record as canonical
    const spiritScore = scoreSpiritCompleteness(spirit);
    const canonicalScore = scoreSpiritCompleteness(canonical);

    if (spiritScore > canonicalScore) {
      // The "duplicate" is actually better — merge canonical into it, then rename
      await mergeInto(spirit.id, canonical.id);
      await prisma.spirit.update({ where: { id: spirit.id }, data: { slug: baseSlug } }).catch(() => {});
    } else {
      await mergeInto(canonical.id, spirit.id);
    }
    merged++;
  }
  return merged;
}

async function deduplicateByName(): Promise<number> {
  // Find groups of spirits sharing the same 30-char name prefix (case-insensitive)
  // Process in batches of 1000 to avoid memory issues
  let merged = 0;
  let cursor: string | undefined;
  const BATCH = 1000;

  while (true) {
    const spirits = await prisma.spirit.findMany({
      take: BATCH,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
      select: { id: true, name: true, slug: true, abv: true, description: true, categoryId: true, distilleryId: true, ageStatement: true },
    });
    if (!spirits.length) break;
    cursor = spirits[spirits.length - 1].id;

    const nameMap = new Map<string, typeof spirits>();
    for (const s of spirits) {
      const key = s.name.substring(0, 30).toLowerCase().trim();
      if (!nameMap.has(key)) nameMap.set(key, []);
      nameMap.get(key)!.push(s);
    }

    for (const [, group] of nameMap) {
      if (group.length < 2) continue;
      // Sort by completeness descending — first is canonical
      group.sort((a, b) => scoreSpiritCompleteness(b) - scoreSpiritCompleteness(a));
      const [canonical, ...duplicates] = group;
      for (const dup of duplicates) {
        await mergeInto(canonical.id, dup.id);
        merged++;
      }
    }
  }
  return merged;
}

export async function runDedup(): Promise<void> {
  console.log('Running cross-source deduplication...');

  console.log('Pass 1: slug-suffix dedup (removing -off/-NNNN suffixes)...');
  const slugMerged = await deduplicateBySlugSuffix();
  console.log(`  Merged ${slugMerged} slug-suffixed duplicates`);

  console.log('Pass 2: name-based dedup (same 30-char prefix)...');
  const nameMerged = await deduplicateByName();
  console.log(`  Merged ${nameMerged} name duplicates`);

  const remaining = await prisma.spirit.count();
  console.log(`Dedup complete. ${remaining} spirits remaining in database.`);
}

runDedup().then(() => prisma.$disconnect()).catch(console.error);
