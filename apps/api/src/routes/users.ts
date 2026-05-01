import type { FastifyInstance } from 'fastify';
import { prisma } from '@pour/db';
import { TasteProfileInputSchema } from '@pour/shared';
import { quizToFlavorProfile } from '../lib/taste-profile.js';
import { computeMatchScore } from '../lib/match-score.js';

export async function usersRoutes(fastify: FastifyInstance) {
  // GET /users/me
  fastify.get('/users/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as { userId: string }).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tasteProfile: true },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return user;
  });

  // POST /users/me/taste-profile — save quiz result
  fastify.post('/users/me/taste-profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as { userId: string }).userId;
    const parsed = TasteProfileInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid quiz data', details: parsed.error.issues });

    const { priceMin, priceMax, ...flavor } = quizToFlavorProfile(parsed.data);

    const profile = await prisma.tasteProfile.upsert({
      where: { userId },
      create: { userId, ...flavor, priceMin, priceMax },
      update: { ...flavor, priceMin, priceMax },
    });

    return profile;
  });

  // GET /users/me/recommendations — top spirits by taste profile match
  fastify.get<{ Querystring: { limit?: string } }>(
    '/users/me/recommendations',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request as { userId: string }).userId;
      const limit = Math.min(50, Math.max(1, Number(request.query.limit ?? 20)));

      const profile = await prisma.tasteProfile.findUnique({ where: { userId } });
      if (!profile) return reply.status(404).send({ error: 'No taste profile. Complete the quiz first.' });

      // Get spirits the user hasn't rated yet, ordered by match score
      const ratedSpiritIds = await prisma.rating.findMany({
        where: { userId },
        select: { spiritId: true },
      }).then((rows) => rows.map((r) => r.spiritId));

      const spirits = await prisma.spirit.findMany({
        where: { id: { notIn: ratedSpiritIds }, ratingCount: { gte: 3 } },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        take: 200, // over-fetch, then score and trim
      });

      const userFlavor = {
        sweet: profile.sweet, smoke: profile.smoke, fruit: profile.fruit,
        grain: profile.grain, spice: profile.spice, floral: profile.floral, body: profile.body,
      };

      const scored = spirits
        .map((s) => ({
          spirit: s,
          matchScore: computeMatchScore(userFlavor, {
            sweet: s.flavorSweet, smoke: s.flavorSmoke, fruit: s.flavorFruit,
            grain: s.flavorGrain, spice: s.flavorSpice, floral: s.flavorFloral, body: s.flavorBody,
          }),
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      return scored.map(({ spirit, matchScore }) => ({
        id: spirit.id,
        name: spirit.name,
        avgRating: spirit.avgRating,
        ratingCount: spirit.ratingCount,
        imageUrl: spirit.images[0]?.url ?? null,
        matchScore,
      }));
    }
  );
}
