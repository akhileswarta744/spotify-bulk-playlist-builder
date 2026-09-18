/**
 * Utility to execute async tasks with concurrency limits and Spotify 429 Retry-After handling.
 */
export async function throttledMap<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;
  let completedCount = 0;

  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];

      let attempts = 0;
      let success = false;

      while (!success && attempts < 4) {
        try {
          results[index] = await fn(item, index);
          success = true;
          completedCount++;
          if (onProgress) {
            onProgress(completedCount, items.length);
          }
        } catch (err: any) {
          attempts++;
          const retryAfter = err?.response?.headers?.['retry-after'];
          const waitTimeMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : Math.min(1000 * Math.pow(2, attempts), 8000);

          if (attempts >= 4) {
            throw err;
          }

          console.warn(
            `[RateLimiter] Rate limited or error on item ${index}. Backing off for ${waitTimeMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
