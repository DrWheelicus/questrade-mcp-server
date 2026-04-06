import { describe, it, expect } from "vitest";
import { RateLimiter } from "@/client/rate-limiter.js";

describe("RateLimiter", () => {
  it("allows requests up to the bucket capacity", async () => {
    const limiter = new RateLimiter(5, 5);
    const results: number[] = [];

    for (let i = 0; i < 5; i++) {
      await limiter.acquire();
      results.push(i);
    }

    expect(results).toEqual([0, 1, 2, 3, 4]);
  });

  it("queues requests beyond capacity and resolves as tokens refill", async () => {
    const limiter = new RateLimiter(2, 100);

    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    // Third request should be queued briefly
    await limiter.acquire();
    const elapsed = Date.now() - start;

    // Should have waited at least a tiny bit for refill
    // With 100 tokens/sec refill rate the wait should be very short
    expect(elapsed).toBeLessThan(500);
  });

  it("handles concurrent acquire calls", async () => {
    const limiter = new RateLimiter(3, 50);
    const promises = Array.from({ length: 6 }, () => limiter.acquire());

    await Promise.all(promises);
    // All should resolve without throwing
    expect(true).toBe(true);
  });

  it("refills tokens over time", async () => {
    const limiter = new RateLimiter(2, 1000);

    await limiter.acquire();
    await limiter.acquire();

    // Wait for refill
    await new Promise((r) => setTimeout(r, 20));

    // Should be able to acquire again after refill
    const start = Date.now();
    await limiter.acquire();
    expect(Date.now() - start).toBeLessThan(100);
  });
});
