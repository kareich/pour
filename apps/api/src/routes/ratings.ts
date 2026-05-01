import type { FastifyInstance } from 'fastify';
import { prisma } from '@pour/db';
import { SubmitRatingSchema } from '@pour/shared';
import { typesenseClient, SPIRITS_COLLECTION } from '../lib/typesense.js';

export async function ratingsRoutes(fastify: FastifyInstance) {
  // POST /ratings — submit a rating with flavor wheel
  fastify.post('/ratings', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as { userId: string }).userId;
    const parsed = SubmitRatingSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid data', details: parsed.error.issues });

    const { spiritId, score, flavor, notes } = parsed.data;

    const spirit = await prisma.spirit.findUnique({ where: { id: spiritId }, select: { id: true } });
    if (!spirit) return reply.status(404).send({ error: 'Spirit not found' });

    const rating = await prisma.rating.upsert({
      where: { userId_spiritId: { userId, spiritId } },
      create: {
        userId, spiritId, score,
        flavorSweet: flavor.sweet, flavorSmoke: flavor.smoke, flavorFruit: flavor.fruit,
        flavorGrain: flavor.grain, flavorSpice: flavor.spice, flavorFloral: flavor.floral,
        flavorBody: flavor.body,
        notes: notes ?? null,
      },
      update: {
        score,
        flavorSweet: flavor.sweet, flavorSmoke: flavor.smoke, flavorFruit: flavor.fruit,
        flavorGrain: flavor.grain, flavorSpice: flavor.spice, flavorFloral: flavor.floral,
        flavorBody: flavor.body,
        notes: notes ?? null,
      },
    });

    // Recompute spirit's average rating and flavor profile
    const allRatings = await prisma.rating.findMany({
      where: { spiritId },
      select: {
        score: true,
        flavorSweet: true, flavorSmoke: true, flavorFruit: true,
        flavorGrain: true, flavorSpice: true, flavorFloral: true, flavorBody: true,
      },
    });

    const count = allRatings.length;
    const avg = (field: keyof typeof allRatings[0]) =>
      allRatings.reduce((sum: number, r) => sum + (r[field] as number), 0) / count;

    await prisma.spirit.update({
      where: { id: spiritId },
      data: {
        avgRating: avg('score'),
        ratingCount: count,
        flavorSweet: avg('flavorSweet'),
        flavorSmoke: avg('flavorSmoke'),
        flavorFruit: avg('flavorFruit'),
        flavorGrain: avg('flavorGrain'),
        flavorSpice: avg('flavorSpice'),
        flavorFloral: avg('flavorFloral'),
        flavorBody: avg('flavorBody'),
      },
    });

    // Sync updated avg_rating + rating_count to Typesense (best-effort, non-blocking)
    typesenseClient.collections(SPIRITS_COLLECTION).documents().upsert({
      id: spiritId,
      avg_rating: avg('score'),
      rating_count: count,
    }).catch(() => { /* Typesense may be unavailable; bulk resync covers eventual consistency */ });

    return reply.status(201).send(rating);
  });
}
