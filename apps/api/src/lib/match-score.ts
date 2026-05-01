import type { FlavorProfile } from '@pour/shared';

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

function profileToVector(p: FlavorProfile): number[] {
  return [p.sweet, p.smoke, p.fruit, p.grain, p.spice, p.floral, p.body];
}

export function computeMatchScore(userProfile: FlavorProfile, spiritFlavor: FlavorProfile): number {
  const similarity = cosineSimilarity(profileToVector(userProfile), profileToVector(spiritFlavor));
  // Map cosine similarity (0–1 for non-negative vectors) to 0–100
  return Math.round(similarity * 100);
}
