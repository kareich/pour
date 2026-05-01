import Typesense from 'typesense';

export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST ?? 'localhost',
      port: Number(process.env.TYPESENSE_PORT ?? 8108),
      protocol: (process.env.TYPESENSE_PROTOCOL as 'http' | 'https') ?? 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY ?? 'xyz',
  connectionTimeoutSeconds: 2,
});

export const SPIRITS_COLLECTION = 'spirits';

export const spiritsCollectionSchema = {
  name: SPIRITS_COLLECTION,
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'name', type: 'string' as const },
    { name: 'distillery_name', type: 'string' as const, facet: true, optional: true },
    { name: 'category', type: 'string' as const, facet: true, optional: true },
    { name: 'subcategory', type: 'string' as const, facet: true, optional: true },
    { name: 'region', type: 'string' as const, facet: true, optional: true },
    { name: 'abv', type: 'float' as const, optional: true },
    { name: 'avg_rating', type: 'float' as const },
    { name: 'rating_count', type: 'int32' as const },
    { name: 'description', type: 'string' as const, optional: true },
    { name: 'image_url', type: 'string' as const, optional: true },
  ],
  default_sorting_field: 'avg_rating',
};
