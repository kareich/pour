/**
 * Spirit Submission Queue
 *
 * Allows users to submit bottles that aren't in the database.
 * Admin endpoint returns the pending queue for review.
 *
 * POST /api/submissions          — submit an unrecognized bottle
 * GET  /api/admin/submissions    — list pending submissions (admin only)
 * PATCH /api/admin/submissions/:id — approve or reject a submission
 */

import type { FastifyInstance } from 'fastify';
import { prisma } from '@pour/db';
import { z } from 'zod';

const SubmitBodySchema = z.object({
  barcode: z.string().min(8).max(20).optional(),
  productName: z.string().min(2).max(255),
  brand: z.string().max(255).optional(),
  imageUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

const ReviewBodySchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export async function submissionsRoutes(fastify: FastifyInstance) {
  // POST /api/submissions — any user can submit
  fastify.post<{ Body: unknown }>('/submissions', async (request, reply) => {
    const parsed = SubmitBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid submission', details: parsed.error.issues });
    }

    const { barcode, productName, brand, imageUrl, notes } = parsed.data;

    // Check if the barcode already exists in the database
    if (barcode) {
      const normalizedBarcode = barcode.replace(/\D/g, '').padStart(13, '0');
      const existing = await prisma.spiritBarcode.findUnique({
        where: { barcode: normalizedBarcode },
        include: { spirit: { select: { id: true, name: true } } },
      });
      if (existing) {
        return reply.status(409).send({
          error: 'Barcode already in database',
          spirit: existing.spirit,
        });
      }
    }

    const submittedBy = (request as { user?: { id?: string } }).user?.id ?? null;

    const submission = await prisma.spiritSubmission.create({
      data: {
        barcode: barcode ?? null,
        productName,
        brand: brand ?? null,
        imageUrl: imageUrl ?? null,
        notes: notes ?? null,
        submittedBy,
        status: 'pending',
      },
    });

    return reply.status(201).send({ id: submission.id, status: 'pending' });
  });

  // GET /api/admin/submissions — admin only
  fastify.get<{
    Querystring: { status?: string; limit?: string; offset?: string };
  }>('/admin/submissions', async (request, reply) => {
    // TODO: enforce admin role check via request.user once admin roles are wired
    const { status = 'pending', limit = '50', offset = '0' } = request.query;

    const submissions = await prisma.spiritSubmission.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take: Math.min(Number(limit), 200),
      skip: Number(offset),
    });

    const total = await prisma.spiritSubmission.count({ where: { status } });
    return { submissions, total };
  });

  // PATCH /api/admin/submissions/:id — approve or reject
  fastify.patch<{
    Params: { id: string };
    Body: unknown;
  }>('/admin/submissions/:id', async (request, reply) => {
    const parsed = ReviewBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid review body', details: parsed.error.issues });
    }

    const { id } = request.params;
    const { status } = parsed.data;
    const reviewedBy = (request as { user?: { id?: string } }).user?.id ?? null;

    const submission = await prisma.spiritSubmission.findUnique({ where: { id } });
    if (!submission) return reply.status(404).send({ error: 'Submission not found' });

    const updated = await prisma.spiritSubmission.update({
      where: { id },
      data: { status, reviewedBy },
    });

    // If approved and has a barcode, create a stub spirit for the data team to enrich
    if (status === 'approved' && submission.barcode) {
      const slug = submission.productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const spirit = await prisma.spirit.upsert({
        where: { slug: `${slug}-submitted` },
        create: { name: submission.productName, slug: `${slug}-submitted` },
        update: {},
      });

      const normalizedBarcode = submission.barcode.replace(/\D/g, '').padStart(13, '0');
      await prisma.spiritBarcode.create({
        data: {
          spiritId: spirit.id,
          barcode: normalizedBarcode,
          barcodeType: normalizedBarcode.length === 13 ? 'EAN13' : 'UPC_A',
        },
      }).catch(() => {}); // ignore if barcode now exists
    }

    return { id: updated.id, status: updated.status };
  });
}
