import type { FastifyInstance } from 'fastify';
import { SearchQuerySchema } from '@pour/shared';
import { typesenseClient, SPIRITS_COLLECTION } from '../lib/typesense.js';

export async function searchRoutes(fastify: FastifyInstance) {
  // GET /search — full search with optional facet filters
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

  // GET /search/autocomplete?q=:partial — typeahead after 2 characters
  fastify.get<{ Querystring: { q?: string } }>('/search/autocomplete', async (request, reply) => {
    const q = request.query.q?.trim() ?? '';
    if (q.length < 2) return { spirits: [], distilleries: [] };

    const results = await typesenseClient.collections(SPIRITS_COLLECTION).documents().search({
      q,
      query_by: 'name,distillery_name',
      prefix: true,
      per_page: 8,
      highlight_full_fields: 'name',
      sort_by: 'avg_rating:desc',
    });

    const hits = results.hits ?? [];

    // Group into spirits and unique distilleries
    const seenDistilleries = new Set<string>();
    const spirits: Array<{ id: string; name: string; distilleryName?: string; imageUrl?: string; avgRating: number }> = [];
    const distilleries: Array<{ name: string }> = [];

    for (const hit of hits) {
      const doc = hit.document as Record<string, unknown>;
      spirits.push({
        id: doc.id as string,
        name: doc.name as string,
        distilleryName: doc.distillery_name as string | undefined,
        imageUrl: doc.image_url as string | undefined,
        avgRating: doc.avg_rating as number,
      });

      const distName = doc.distillery_name as string | undefined;
      if (distName && !seenDistilleries.has(distName)) {
        seenDistilleries.add(distName);
        distilleries.push({ name: distName });
      }
    }

    return { spirits, distilleries };
  });

  // GET /spirits/browse — filter-heavy browse endpoint (ABV, price, age, rating, region)
  fastify.get<{ Querystring: Record<string, string> }>('/spirits/browse', async (request, reply) => {
    const {
      category, region, distillery,
      abv_min, abv_max,
      rating_min,
      age_min,
      sort = 'avg_rating:desc',
      page: pageStr = '1',
      per_page: perPageStr = '24',
    } = request.query;

    const page = Math.max(1, Number(pageStr) || 1);
    const perPage = Math.min(48, Math.max(1, Number(perPageStr) || 24));

    const filterParts: string[] = [];
    if (category) filterParts.push(`category:=${category}`);
    if (region) filterParts.push(`region:=${region}`);
    if (distillery) filterParts.push(`distillery_name:=${distillery}`);
    if (abv_min) filterParts.push(`abv:>=${abv_min}`);
    if (abv_max) filterParts.push(`abv:<=${abv_max}`);
    if (rating_min) filterParts.push(`avg_rating:>=${rating_min}`);
    if (age_min) filterParts.push(`age_statement:>=${age_min}`);

    const allowedSorts = ['avg_rating:desc', 'rating_count:desc', 'name:asc'];
    const sortBy = allowedSorts.includes(sort) ? sort : 'avg_rating:desc';

    const results = await typesenseClient.collections(SPIRITS_COLLECTION).documents().search({
      q: '*',
      query_by: 'name',
      filter_by: filterParts.length ? filterParts.join(' && ') : undefined,
      sort_by: sortBy,
      page,
      per_page: perPage,
      facet_by: 'category,region',
    });

    return {
      data: results.hits?.map((hit) => hit.document) ?? [],
      total: results.found,
      page,
      perPage,
      facets: results.facet_counts ?? [],
    };
  });
}
