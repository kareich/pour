import type { FlavorProfile } from '../components/FlavorWheel';

export type QuizAnswers = {
  categories: string[];
  flavorDirection: string;
  smokePreference: string;
  priceRange: string;
  drinkingStyle: string;
  fruitNotes: string;
  discoveryStyle: string;
  primaryGoal: string[];
};

export type Persona = {
  name: string;
  tagline: string;
};

const PERSONAS: Array<Persona & { score: (a: QuizAnswers) => number }> = [
  {
    name: 'The Peat Pilgrim',
    tagline: 'Where there\'s smoke, there\'s character',
    score: (a) => {
      let s = 0;
      if (a.smokePreference === 'love') s += 40;
      if (a.categories.includes('Scotch')) s += 30;
      if (a.flavorDirection === 'bold') s += 15;
      if (a.discoveryStyle === 'classic') s += 10;
      return s;
    },
  },
  {
    name: 'The Bourbon Explorer',
    tagline: 'Bold, American, and never boring',
    score: (a) => {
      let s = 0;
      if (a.categories.includes('Bourbon')) s += 35;
      if (a.categories.includes('Rye')) s += 15;
      if (a.flavorDirection === 'bold' || a.flavorDirection === 'sweet') s += 20;
      if (a.smokePreference === 'none' || a.smokePreference === 'little') s += 10;
      if (a.discoveryStyle === 'regional') s += 10;
      return s;
    },
  },
  {
    name: 'The Cocktail Craftsman',
    tagline: 'Spirits are just the beginning',
    score: (a) => {
      let s = 0;
      if (a.drinkingStyle === 'cocktails') s += 45;
      if (a.flavorDirection === 'fruity') s += 20;
      if (a.categories.includes('Gin') || a.categories.includes('Rum') || a.categories.includes('Tequila')) s += 20;
      if (a.primaryGoal.includes('entertain')) s += 10;
      return s;
    },
  },
  {
    name: 'The Spirit Collector',
    tagline: 'Every bottle tells a story',
    score: (a) => {
      let s = 0;
      if (a.priceRange === 'nolimit') s += 30;
      if (a.priceRange === '80to150') s += 15;
      if (a.primaryGoal.includes('collecting')) s += 40;
      if (a.drinkingStyle === 'collecting') s += 20;
      return s;
    },
  },
  {
    name: 'The Sweet Sipper',
    tagline: 'Life\'s too short for harsh drams',
    score: (a) => {
      let s = 0;
      if (a.flavorDirection === 'sweet') s += 40;
      if (a.smokePreference === 'none') s += 25;
      if (a.priceRange === 'under40' || a.priceRange === '40to80') s += 10;
      if (a.fruitNotes === 'stone') s += 10;
      return s;
    },
  },
  {
    name: 'The Global Wanderer',
    tagline: 'No borders, no limits',
    score: (a) => {
      let s = 0;
      if (a.categories.length >= 3) s += 30;
      if (a.discoveryStyle === 'global') s += 40;
      if (a.primaryGoal.includes('explore')) s += 20;
      if (a.categories.includes('Japanese') || a.categories.includes('Irish')) s += 10;
      return s;
    },
  },
];

export function determinePersona(answers: QuizAnswers): Persona {
  let best = PERSONAS[0];
  let bestScore = PERSONAS[0].score(answers);
  for (const p of PERSONAS.slice(1)) {
    const s = p.score(answers);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return { name: best.name, tagline: best.tagline };
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function computeFlavorProfile(answers: QuizAnswers): FlavorProfile {
  const { categories, flavorDirection, smokePreference, fruitNotes } = answers;

  const sweetBase: Record<string, number> = { sweet: 0.85, fruity: 0.55, clean: 0.35, bold: 0.22 };
  const smokeBase: Record<string, number> = { love: 0.9, little: 0.45, none: 0.05, unknown: 0.2 };
  const fruitBase: Record<string, number> = { fruity: 0.82, sweet: 0.42, clean: 0.32, bold: 0.18 };
  const grainBase: Record<string, number> = { clean: 0.78, bold: 0.52, sweet: 0.38, fruity: 0.28 };
  const spiceBase: Record<string, number> = { bold: 0.88, fruity: 0.32, sweet: 0.28, clean: 0.22 };
  const floralBase: Record<string, number> = { fruity: 0.68, clean: 0.58, sweet: 0.42, bold: 0.22 };

  let sweet  = sweetBase[flavorDirection] ?? 0.5;
  let smoke  = smokeBase[smokePreference] ?? 0.3;
  let fruit  = fruitBase[flavorDirection] ?? 0.4;
  let grain  = grainBase[flavorDirection] ?? 0.4;
  let spice  = spiceBase[flavorDirection] ?? 0.4;
  let floral = floralBase[flavorDirection] ?? 0.4;

  // Category modifiers
  if (categories.includes('Scotch'))   smoke  = clamp(smoke + 0.12);
  if (categories.includes('Bourbon'))  sweet  = clamp(sweet + 0.08);
  if (categories.includes('Bourbon') || categories.includes('Rye')) grain = clamp(grain + 0.1);
  if (categories.includes('Rye'))      spice  = clamp(spice + 0.12);
  if (categories.includes('Gin'))      floral = clamp(floral + 0.18);
  if (categories.includes('Tequila') || categories.includes('Rum')) fruit = clamp(fruit + 0.1);
  if (categories.includes('Japanese')) floral = clamp(floral + 0.1);

  // Fruit notes modifiers
  if (fruitNotes === 'citrus')   { fruit = clamp(fruit + 0.12); floral = clamp(floral + 0.08); }
  if (fruitNotes === 'tropical') { fruit = clamp(fruit + 0.1);  sweet  = clamp(sweet + 0.06); }
  if (fruitNotes === 'stone')    { fruit = clamp(fruit + 0.06); sweet  = clamp(sweet + 0.04); }

  // Body from price range (proxy for complexity preference)
  const bodyByPrice: Record<string, number> = { nolimit: 0.88, '80to150': 0.72, '40to80': 0.55, under40: 0.38 };
  let body = bodyByPrice[answers.priceRange] ?? 0.5;
  if (answers.drinkingStyle === 'neat')      body = clamp(body + 0.08);
  if (answers.drinkingStyle === 'cocktails') body = clamp(body - 0.08);

  return { sweet, smoke, fruit, grain, spice, floral, body };
}

// Scale 0-1 values to 0-100 for display
export function scaleProfile(p: FlavorProfile): FlavorProfile {
  return {
    sweet:  Math.round(p.sweet  * 100) / 100,
    smoke:  Math.round(p.smoke  * 100) / 100,
    fruit:  Math.round(p.fruit  * 100) / 100,
    grain:  Math.round(p.grain  * 100) / 100,
    spice:  Math.round(p.spice  * 100) / 100,
    floral: Math.round(p.floral * 100) / 100,
    body:   Math.round(p.body   * 100) / 100,
  };
}
