import type { FastifyInstance } from 'fastify';
import { prisma } from '@pour/db';
import { computeMatchScore } from '../lib/match-score.js';
import type { FlavorProfile } from '@pour/shared';

function spiritToFlavorProfile(spirit: {
  flavorSweet: number; flavorSmoke: number; flavorFruit: number;
  flavorGrain: number; flavorSpice: number; flavorFloral: number; flavorBody: number;
}): FlavorProfile {
  return {
    sweet: spirit.flavorSweet, smoke: spirit.flavorSmoke, fruit: spirit.flavorFruit,
    grain: spirit.flavorGrain, spice: spirit.flavorSpice, floral: spirit.flavorFloral,
    body: spirit.flavorBody,
  };
}

export async function spiritsRoutes(fastify: FastifyInstance) {
  // GET /spirits/:id — spirit detail
  fastify.get<{ Params: { id: string } }>('/spirits/:id', async (request, reply) => {
    const spirit = await prisma.spirit.findUnique({
      where: { id: request.params.id },
      include: {
        distillery: { select: { id: true, name: true, region: true, country: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        attributes: true,
      },
    });

    if (!spirit) return reply.status(404).send({ error: 'Spirit not found' });

    const primaryImage = spirit.images[0]?.url ?? null;
    const spiritFlavor = spiritToFlavorProfile(spirit);

    // Compute match score if user is authenticated and has a taste profile
    let matchScore: number | null = null;
    const userId = (request as { userId?: string }).userId;
    if (userId) {
      const profile = await prisma.tasteProfile.findUnique({ where: { userId } });
      if (profile) {
        matchScore = computeMatchScore(
          { sweet: profile.sweet, smoke: profile.smoke, fruit: profile.fruit,
            grain: profile.grain, spice: profile.spice, floral: profile.floral, body: profile.body },
          spiritFlavor
        );
      }
    }

    return {
      id: spirit.id,
      name: spirit.name,
      distillery: spirit.distillery,
      category: spirit.category,
      subcategory: spirit.subcategory,
      abv: spirit.abv,
      ageStatement: spirit.ageStatement,
      description: spirit.description,
      avgRating: spirit.avgRating,
      ratingCount: spirit.ratingCount,
      imageUrl: primaryImage,
      flavor: spiritFlavor,
      attributes: spirit.attributes,
      matchScore,
    };
  });

  // GET /spirits/:id/ratings — paginated ratings
  fastify.get<{ Params: { id: string }; Querystring: { page?: string; perPage?: string } }>(
    '/spirits/:id/ratings',
    async (request, reply) => {
      const page = Math.max(1, Number(request.query.page ?? 1));
      const perPage = Math.min(50, Math.max(1, Number(request.query.perPage ?? 20)));

      const [ratings, total] = await Promise.all([
        prisma.rating.findMany({
          where: { spiritId: request.params.id },
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.rating.count({ where: { spiritId: request.params.id } }),
      ]);

      if (!ratings.length && page === 1) {
        const spirit = await prisma.spirit.findUnique({ where: { id: request.params.id }, select: { id: true } });
        if (!spirit) return reply.status(404).send({ error: 'Spirit not found' });
      }

      return { data: ratings, total, page, perPage };
    }
  );
}
