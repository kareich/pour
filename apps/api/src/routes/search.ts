import type { FastifyInstance } from 'fastify';
import { SearchQuerySchema } from '@pour/shared';
import { typesenseClient, SPIRITS_COLLECTION } from '../lib/typesense.js';

export async function searchRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: Record<string, string> }>('/search', async (request, reply) => {
    const parsed = SearchQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid query', details: parsed.error.issues });

    const { q, category, distillery, page, perPage } = parsed.data;

    const filterParts: string[] = [];
    if (category) filterParts.push(`category:=${category}`);
    if (distillery) filterParts.push(`distillery_name:=${distillery}`);

    const results = await typesenseClient.collections(SPIRITS_COLLECTION).documents().search({
      q,
      query_by: 'name,distillery_name,description',
      filter_by: filterParts.length ? filterParts.join(' && ') : undefined,
      sort_by: 'avg_rating:desc',
      page,
      per_page: perPage,
      highlight_full_fields: 'name',
    });

    return {
      data: results.hits?.map((hit) => hit.document) ?? [],
      total: results.found,
      page,
      perPage,
    };
  });
}
