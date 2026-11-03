/*
 * Copyright (c) 2026 Omar ElSabbagh.
 * Licensed under the MIT License.
 */

import { ERROR_CODES } from '../core/constants.js';
import { AppError } from '../utils/errors.js';

export class SlidingWindowRateLimiter {
  constructor({ maxDestructivePerMinute = 10, maxMessagesPerMinute = 30, windowMs = 60000 } = {}) {
    this.limits = {
      destructive: Math.max(1, Number(maxDestructivePerMinute) || 10),
      message: Math.max(1, Number(maxMessagesPerMinute) || 30),
      general: 120
    };
    this.windowMs = Math.max(1000, Number(windowMs) || 60000);
    this.buckets = new Map();
  }

  pruneBucket(bucketKey, now) {
    const timestamps = this.buckets.get(bucketKey);
    if (!timestamps) {
      return [];
    }
    const cutoff = now - this.windowMs;
    const active = timestamps.filter((timestamp) => timestamp > cutoff);
    if (active.length === 0) {
      this.buckets.delete(bucketKey);
    } else {
      this.buckets.set(bucketKey, active);
    }
    return active;
  }

  consume(category = 'general', scopeKey = 'global') {
    const now = Date.now();
    const limit = this.limits[category] ?? this.limits.general;
    const bucketKey = `${category}:${scopeKey}`;
    const active = this.pruneBucket(bucketKey, now);

    if (active.length >= limit) {
      const oldest = active[0];
      const retryAfterMs = Math.max(100, this.windowMs - (now - oldest));
      throw new AppError(
        ERROR_CODES.RATE_LIMITED,
        `Rate limit exceeded for "${category}" operations (${limit} per ${Math.round(this.windowMs / 1000)}s). Retry in ${Math.ceil(retryAfterMs / 1000)}s.`,
        {
          category,
          scopeKey,
          limit,
          windowMs: this.windowMs,
          retryAfterMs
        }
      );
    }

    active.push(now);
    this.buckets.set(bucketKey, active);

    return {
      allowed: true,
      remaining: Math.max(0, limit - active.length),
      limit
    };
  }

  reset() {
    this.buckets.clear();
  }
}

