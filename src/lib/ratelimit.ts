import { RateLimiterMemory } from "rate-limiter-flexible";

export const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900, // 15 minutes
});

export const printsLimiter = new RateLimiterMemory({
  points: 10,
  duration: 3600, // 1 hour
});

export const clipsLimiter = new RateLimiterMemory({
  points: 100,
  duration: 3600, // 1 hour
});

export function getIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}
