import { z } from 'zod';

export const FlavorProfileSchema = z.object({
  sweet: z.number().min(0).max(1),
  smoke: z.number().min(0).max(1),
  fruit: z.number().min(0).max(1),
  grain: z.number().min(0).max(1),
  spice: z.number().min(0).max(1),
  floral: z.number().min(0).max(1),
  body: z.number().min(0).max(1),
});

export const TasteProfileInputSchema = z.object({
  categories: z.array(z.string()).min(1),
  flavorDirection: z.enum(['sweet', 'bold', 'fruity', 'clean']),
  smokePreference: z.enum(['love', 'little', 'none', 'unknown']),
  agePreference: z.enum(['young', 'aged', 'either']),
  sweetnessPreference: z.enum(['sweeter', 'balanced', 'dry']),
  proofPreference: z.enum(['easy', 'standard', 'cask']),
  priceRange: z.enum(['under40', '40to80', '80to150', 'nolimit']),
  drinkingContext: z.array(z.enum(['neat', 'cocktails', 'collecting', 'all'])),
});

export const SubmitRatingSchema = z.object({
  spiritId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  flavor: FlavorProfileSchema,
  notes: z.string().max(100).nullable().optional(),
  drinkingContext: z.enum(['neat', 'rocks', 'cocktail']).nullable().optional(),
});

export const AddToCollectionSchema = z.object({
  spiritId: z.string().uuid(),
  bottleStatus: z.enum(['sealed', 'open', 'empty']),
  pricePaid: z.number().positive().nullable().optional(),
  acquiredAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const UpdateCollectionSchema = z.object({
  bottleStatus: z.enum(['sealed', 'open', 'empty']).optional(),
  pricePaid: z.number().positive().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const AddToWishlistSchema = z.object({
  spiritId: z.string().uuid(),
  targetPrice: z.number().positive().nullable().optional(),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  distillery: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});

export const ScanBarcodeQuerySchema = z.object({
  barcode: z.string().min(8).max(14),
});
