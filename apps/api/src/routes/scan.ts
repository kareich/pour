import type { FastifyInstance } from 'fastify';
import { prisma } from '@pour/db';
import { ScanBarcodeQuerySchema } from '@pour/shared';

export async function scanRoutes(fastify: FastifyInstance) {
  // GET /scan?barcode=X — barcode lookup
  fastify.get<{ Querystring: { barcode: string } }>('/scan', async (request, reply) => {
    const parsed = ScanBarcodeQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid barcode', details: parsed.error.issues });

    const { barcode } = parsed.data;
    const normalizedBarcode = barcode.padStart(13, '0');

    const barcodeRecord = await prisma.spiritBarcode.findUnique({
      where: { barcode: normalizedBarcode },
      include: {
        spirit: {
          include: {
            distillery: { select: { name: true, region: true } },
            category: { select: { name: true, slug: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    // Also try un-padded barcode
    const barcodeRecordRaw = barcodeRecord ?? await prisma.spiritBarcode.findUnique({
      where: { barcode },
      include: {
        spirit: {
          include: {
            distillery: { select: { name: true, region: true } },
            category: { select: { name: true, slug: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    if (!barcodeRecordRaw) {
      return reply.status(404).send({ error: 'Spirit not found for this barcode', barcode });
    }

    const spirit = barcodeRecordRaw.spirit;
    return {
      spirit: {
        id: spirit.id,
        name: spirit.name,
        distillery: spirit.distillery,
        category: spirit.category,
        abv: spirit.abv,
        avgRating: spirit.avgRating,
        ratingCount: spirit.ratingCount,
        imageUrl: spirit.images[0]?.url ?? null,
      },
      source: 'barcode' as const,
      confidence: 1.0,
    };
  });

  // POST /scan/ocr — image OCR → spirit lookup
  fastify.post<{ Body: { imageBase64: string } }>('/scan/ocr', async (request, reply) => {
    const { imageBase64 } = request.body;
    if (!imageBase64) return reply.status(400).send({ error: 'imageBase64 is required' });

    // Call Google Cloud Vision API
    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!visionApiKey) return reply.status(503).send({ error: 'OCR service not configured' });

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      return reply.status(502).send({ error: 'OCR service error' });
    }

    const visionData = await visionResponse.json() as {
      responses: Array<{ textAnnotations?: Array<{ description: string }> }>;
    };
    const fullText = visionData.responses[0]?.textAnnotations?.[0]?.description ?? '';
    if (!fullText) return reply.status(404).send({ error: 'No text detected in image' });

    // Extract candidate name: take first 2-3 lines (brand + expression typically at top)
    const lines = fullText.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const candidateName = lines.slice(0, 3).join(' ').substring(0, 100);

    // Fuzzy search via Typesense
    const { typesenseClient, SPIRITS_COLLECTION } = await import('../lib/typesense.js');
    const searchResult = await typesenseClient.collections(SPIRITS_COLLECTION).documents().search({
      q: candidateName,
      query_by: 'name,description',
      per_page: 1,
    });

    const hit = searchResult.hits?.[0];
    if (!hit) return reply.status(404).send({ error: 'Spirit not found', candidateName });

    const spiritId = (hit.document as { id: string }).id;
    const spirit = await prisma.spirit.findUnique({
      where: { id: spiritId },
      include: {
        distillery: { select: { name: true, region: true } },
        category: { select: { name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    if (!spirit) return reply.status(404).send({ error: 'Spirit not found' });

    return {
      spirit: {
        id: spirit.id,
        name: spirit.name,
        distillery: spirit.distillery,
        category: spirit.category,
        abv: spirit.abv,
        avgRating: spirit.avgRating,
        ratingCount: spirit.ratingCount,
        imageUrl: spirit.images[0]?.url ?? null,
      },
      source: 'ocr' as const,
      confidence: hit.text_match_info?.score ? Math.min(1, hit.text_match_info.score / 100) : 0.7,
      candidateName,
    };
  });
}
