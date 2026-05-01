import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClerkClient } from '@clerk/fastify';
import { prisma } from '@pour/db';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    userId: string;
  }
}

export const authPlugin = fp(async (fastify: FastifyInstance) => {
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY ?? '',
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing authorization header' });
    }

    const token = authHeader.slice(7);
    try {
      const payload = await clerkClient.verifyToken(token);
      const clerkUserId = payload.sub;

      // Find or create user in our DB
      let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
      if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
        const username = clerkUser.username ?? clerkUserId.slice(0, 20);
        user = await prisma.user.create({
          data: {
            clerkId: clerkUserId,
            email,
            username,
            displayName: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || username,
            avatarUrl: clerkUser.imageUrl ?? null,
            is21Plus: false,
          },
        });
      }

      (request as FastifyRequest & { userId: string }).userId = user.id;
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
  });
});
