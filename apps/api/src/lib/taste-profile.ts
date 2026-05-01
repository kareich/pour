import type { TasteProfileInputSchema } from '@pour/shared';
import type { z } from 'zod';
import type { FlavorProfile } from '@pour/shared';

type QuizInput = z.infer<typeof TasteProfileInputSchema>;

export function quizToFlavorProfile(quiz: QuizInput): FlavorProfile & { priceMin: number | null; priceMax: number | null } {
  const flavor: FlavorProfile = {
    sweet: 0.5,
    smoke: 0.2,
    fruit: 0.4,
    grain: 0.5,
    spice: 0.4,
    floral: 0.2,
    body: 0.5,
  };

  // Flavor direction
  switch (quiz.flavorDirection) {
    case 'sweet':
      flavor.sweet = 0.85; flavor.grain = 0.4; flavor.spice = 0.3;
      break;
    case 'bold':
      flavor.spice = 0.8; flavor.body = 0.75; flavor.sweet = 0.3;
      break;
    case 'fruity':
      flavor.fruit = 0.8; flavor.floral = 0.5; flavor.sweet = 0.6;
      break;
    case 'clean':
      flavor.grain = 0.7; flavor.body = 0.3; flavor.smoke = 0.05;
      break;
  }

  // Smoke
  switch (quiz.smokePreference) {
    case 'love':  flavor.smoke = 0.85; break;
    case 'little': flavor.smoke = 0.35; break;
    case 'none':
    case 'unknown': flavor.smoke = 0.05; break;
  }

  // Sweetness
  switch (quiz.sweetnessPreference) {
    case 'sweeter': flavor.sweet = Math.max(flavor.sweet, 0.75); break;
    case 'dry':     flavor.sweet = Math.min(flavor.sweet, 0.25); break;
  }

  // Body (proof preference)
  switch (quiz.proofPreference) {
    case 'easy': flavor.body = Math.min(flavor.body, 0.35); break;
    case 'cask': flavor.body = Math.max(flavor.body, 0.75); break;
  }

  // Age preference influences grain/complexity
  switch (quiz.agePreference) {
    case 'aged': flavor.grain = Math.min(flavor.grain, 0.4); flavor.floral = Math.max(flavor.floral, 0.4); break;
    case 'young': flavor.grain = Math.max(flavor.grain, 0.65); break;
  }

  // Price range
  let priceMin: number | null = null;
  let priceMax: number | null = null;
  switch (quiz.priceRange) {
    case 'under40': priceMin = 0; priceMax = 40; break;
    case '40to80':  priceMin = 40; priceMax = 80; break;
    case '80to150': priceMin = 80; priceMax = 150; break;
    case 'nolimit': priceMin = null; priceMax = null; break;
  }

  // Category-based adjustments for bourbon lovers
  if (quiz.categories.includes('Bourbon')) {
    flavor.sweet = Math.max(flavor.sweet, 0.55);
    flavor.grain = Math.max(flavor.grain, 0.55);
  }
  if (quiz.categories.includes('Scotch')) {
    flavor.smoke = Math.max(flavor.smoke, 0.3);
    flavor.floral = Math.max(flavor.floral, 0.3);
  }
  if (quiz.categories.includes('Tequila')) {
    flavor.floral = Math.max(flavor.floral, 0.4);
    flavor.fruit = Math.max(flavor.fruit, 0.5);
  }

  // Clamp all values to [0, 1]
  for (const key of Object.keys(flavor) as (keyof FlavorProfile)[]) {
    flavor[key] = Math.max(0, Math.min(1, flavor[key]));
  }

  return { ...flavor, priceMin, priceMax };
}
