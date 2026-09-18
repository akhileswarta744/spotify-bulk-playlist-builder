/**
 * Normalizes text for robust song title & artist comparison.
 * - Converts to lowercase
 * - Strips diacritics / accents
 * - Strips common soundtrack / movie suffixes like (From "Bang Bang"), [Remix], etc.
 * - Removes non-alphanumeric punctuation
 * - Collapses extra whitespace
 */
export function normalizeString(str: string): string {
  if (!str) return '';

  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/\(from\s+[^)]+\)/gi, '') // remove (From "Movie")
    .replace(/\[from\s+[^\]]+\]/gi, '') // remove [From "Movie"]
    .replace(/\(original motion picture soundtrack\)/gi, '')
    .replace(/\[original motion picture soundtrack\]/gi, '')
    .replace(/\(feat\.?[^)]*\)/gi, '')
    .replace(/\[feat\.?[^\]]*\]/gi, '')
    .replace(/[^\w\s]/gi, ' ') // remove punctuation
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
}

/**
 * Calculates Sørensen-Dice coefficient between two strings based on bigrams.
 * Returns a number between 0.0 (no similarity) and 1.0 (exact match).
 */
export function diceCoefficient(first: string, second: string): number {
  const s1 = normalizeString(first);
  const s2 = normalizeString(second);

  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const firstBigrams = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram)! + 1 : 1;
    firstBigrams.set(bigram, count);
  }

  let intersectionSize = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    const count = firstBigrams.get(bigram) || 0;
    if (count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (s1.length + s2.length - 2);
}

/**
 * Computes Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = normalizeString(a);
  const s2 = normalizeString(b);

  const m = s1.length;
  const n = s2.length;
  const d: number[][] = [];

  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }

  return d[m][n];
}

/**
 * Similarity ratio based on Levenshtein distance: 1.0 (identical) to 0.0 (completely different).
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const s1 = normalizeString(a);
  const s2 = normalizeString(b);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - levenshteinDistance(s1, s2) / maxLen;
}

/**
 * Combined similarity score (weighted combination of Dice bigrams, Levenshtein, and substring containment).
 */
export function calculateStringSimilarity(target: string, candidate: string): number {
  const normTarget = normalizeString(target);
  const normCandidate = normalizeString(candidate);

  if (normTarget === normCandidate) return 1.0;
  if (!normTarget || !normCandidate) return 0.0;

  // Exact substring check
  if (normCandidate.startsWith(normTarget) || normTarget.startsWith(normCandidate)) {
    return 0.95;
  }
  if (normCandidate.includes(normTarget) || normTarget.includes(normCandidate)) {
    return 0.88;
  }

  const dice = diceCoefficient(target, candidate);
  const lev = levenshteinSimilarity(target, candidate);

  return dice * 0.6 + lev * 0.4;
}
