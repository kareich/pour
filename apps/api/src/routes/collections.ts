import type { FastifyInstance } from 'fastify';
import { prisma } from '@pour/db';
import { AddToCollectionSchema, UpdateCollectionSchema } from '@pour/shared';

export async function collectionsRoutes(fastify: FastifyInstance) {
  // GET /collections
  fastify.get('/collections', { preHandler: [fastify.authenticate] }, async (request) => {
    const userId = (request as { userId: string }).userId;
    const entries = await prisma.collectionEntry.findMany({
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

  // POST /collections
  fastify.post('/collections', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as { userId: string }).userId;
    const parsed = AddToCollectionSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid data', details: parsed.error.issues });

    const { spiritId, bottleStatus, pricePaid, acquiredAt, notes } = parsed.data;

    const spirit = await prisma.spirit.findUnique({ where: { id: spiritId }, select: { id: true } });
    if (!spirit) return reply.status(404).send({ error: 'Spirit not found' });

    const entry = await prisma.collectionEntry.upsert({
      where: { userId_spiritId: { userId, spiritId } },
      create: {
        userId, spiritId, bottleStatus,
        pricePaid: pricePaid ?? null,
        acquiredAt: acquiredAt ? new Date(acquiredAt) : null,
        notes: notes ?? null,
      },
      update: {
        bottleStatus,
        pricePaid: pricePaid ?? null,
        notes: notes ?? null,
      },
    });
    return reply.status(201).send(entry);
  });

  // PATCH /collections/:id
  fastify.patch<{ Params: { id: string } }>(
    '/collections/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request as { userId: string }).userId;
      const parsed = UpdateCollectionSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid data', details: parsed.error.issues });

      const existing = await prisma.collectionEntry.findUnique({ where: { id: request.params.id } });
      if (!existing) return reply.status(404).send({ error: 'Not found' });
      if (existing.userId !== userId) return reply.status(403).send({ error: 'Forbidden' });

      const updated = await prisma.collectionEntry.update({
        where: { id: request.params.id },
        data: parsed.data,
      });
      return updated;
    }
  );

  // DELETE /collections/:id
  fastify.delete<{ Params: { id: string } }>(
    '/collections/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request as { userId: string }).userId;
      const existing = await prisma.collectionEntry.findUnique({ where: { id: request.params.id } });
      if (!existing) return reply.status(404).send({ error: 'Not found' });
      if (existing.userId !== userId) return reply.status(403).send({ error: 'Forbidden' });
      await prisma.collectionEntry.delete({ where: { id: request.params.id } });
      return reply.status(204).send();
    }
  );
}
