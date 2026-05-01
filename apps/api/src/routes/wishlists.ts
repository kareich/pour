import type { FastifyInstance } from 'fastify';
import { prisma } from '@pour/db';
import { AddToWishlistSchema } from '@pour/shared';

export async function wishlistsRoutes(fastify: FastifyInstance) {
  // GET /wishlists
  fastify.get('/wishlists', { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = (request as { userId: string }).userId;
    const entries = await prisma.wishlistEntry.findMany({
      where: { userId },
      include: {
        spirit: {
          include: {
            distillery: { select: { name: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return entries;
  });

  // POST /wishlists
  fastify.post('/wishlists', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as { userId: string }).userId;
    const parsed = AddToWishlistSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid data', details: parsed.error.issues });

    const { spiritId, targetPrice } = parsed.data;
    const spirit = await prisma.spirit.findUnique({ where: { id: spiritId }, select: { id: true } });
    if (!spirit) return reply.status(404).send({ error: 'Spirit not found' });

    const entry = await prisma.wishlistEntry.upsert({
      where: { userId_spiritId: { userId, spiritId } },
      create: { userId, spiritId, targetPrice: targetPrice ?? null },
      update: { targetPrice: targetPrice ?? null },
    });
    return reply.status(201).send(entry);
  });

  // DELETE /wishlists/:id
  fastify.delete<{ Params: { id: string } }>(
    '/wishlists/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request as { userId: string }).userId;
      const existing = await prisma.wishlistEntry.findUnique({ where: { id: request.params.id } });
      if (!existing) return reply.status(404).send({ error: 'Not found' });
      if (existing.userId !== userId) return reply.status(403).send({ error: 'Forbidden' });
      await prisma.wishlistEntry.delete({ where: { id: request.params.id } });
      return reply.status(204).send();
    }
  );
}
