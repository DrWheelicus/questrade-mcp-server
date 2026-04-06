/**
 * Token-bucket rate limiter. Queues requests that exceed the bucket capacity
 * and drains them as tokens refill.
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly queue: Array<() => void> = [];
  private draining = false;

  constructor(
    private readonly maxTokens: number = 20,
    private readonly refillRatePerSec: number = 20,
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.scheduleDrain();
    });
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRatePerSec);
    this.lastRefill = now;
  }

  private scheduleDrain(): void {
    if (this.draining) return;
    this.draining = true;

    const interval = setInterval(() => {
      this.refill();

      while (this.queue.length > 0 && this.tokens >= 1) {
        this.tokens -= 1;
        const next = this.queue.shift();
        next?.();
      }

      if (this.queue.length === 0) {
        clearInterval(interval);
        this.draining = false;
      }
    }, 50);

    // Don't keep the process alive just for rate limiter draining
    interval.unref();
  }
}
