/**
 * Seed a board test account with a 15-bottle sample collection.
 *
 * Prerequisites:
 *   1. Database must be seeded (run seed:all first).
 *   2. Create a Clerk account with email test@pour.app and a password.
 *   3. Copy the Clerk user ID from the Clerk dashboard (Users tab).
 *
 * Usage:
 *   CLERK_ID=user_xxxx pnpm --filter workers seed:test-account
 *
 * Idempotent — safe to re-run. Upserts the user and collection entries.
 */

import { prisma } from '@pour/db';

const TEST_EMAIL = 'test@pour.app';
const TEST_USERNAME = 'boardtester';
const TEST_DISPLAY_NAME = 'Board Test User';

const SAMPLE_SPIRIT_NAMES = [
  "Maker's Mark",
  'Buffalo Trace',
  'Bulleit Bourbon',
  'Woodford Reserve',
  "Jack Daniel's Old No. 7",
  'Johnnie Walker Black Label',
  "Hendrick's Gin",
  'Tanqueray London Dry Gin',
  'Grey Goose',
  "Tito's Handmade Vodka",
  'Patrón Silver',
  'Don Julio Blanco',
  'Bacardi Superior',
  'Glenfiddich 12 Year',
  'Jameson Irish Whiskey',
];

const STATUSES = ['sealed', 'open', 'finished'] as const;

async function main() {
  const clerkId = process.env.CLERK_ID;
  if (!clerkId) {
    console.error('Error: CLERK_ID env var is required.');
    console.error('  Get it from the Clerk dashboard → Users → select test@pour.app → copy User ID');
    console.error('  Then run: CLERK_ID=user_xxxx pnpm --filter workers seed:test-account');
    process.exit(1);
  }

  console.log(`Seeding test account: ${TEST_EMAIL} (Clerk ID: ${clerkId})`);

  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    create: {
      clerkId,
      email: TEST_EMAIL,
      username: TEST_USERNAME,
      displayName: TEST_DISPLAY_NAME,
      is21Plus: true,
      tasteProfile: {
        create: {
          sweet: 0.6,
          smoke: 0.3,
          fruit: 0.5,
          grain: 0.7,
          spice: 0.5,
          floral: 0.2,
          body: 0.6,
        },
      },
    },
    update: { clerkId },
  });

  console.log(`User upserted: ${user.id}`);

  // Find matching spirits by name (partial match, case-insensitive)
  const spirits = await prisma.spirit.findMany({
    where: {
      OR: SAMPLE_SPIRIT_NAMES.map((name) => ({
        name: { contains: name.split(' ')[0], mode: 'insensitive' as const },
      })),
    },
    take: 30,
  });

  const selected = spirits.slice(0, 15);

  if (selected.length < 15) {
    console.warn(`Warning: only found ${selected.length} matching spirits. Run seed:all first.`);
  }

  let added = 0;
  for (const [i, spirit] of selected.entries()) {
    const status = STATUSES[i % STATUSES.length];
    await prisma.collectionEntry.upsert({
      where: { userId_spiritId: { userId: user.id, spiritId: spirit.id } },
      create: {
        userId: user.id,
        spiritId: spirit.id,
        bottleStatus: status,
        acquiredAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
      },
      update: {},
    });
    added++;
    console.log(`  [${i + 1}/15] ${spirit.name} (${status})`);
  }

  console.log(`\nDone. ${added} bottles added to test account collection.`);
  console.log(`\nTest credentials:`);
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: (whatever you set in Clerk)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect().finally(() => process.exit(1));
  });
