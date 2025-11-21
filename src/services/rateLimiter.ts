// Rate limiter for API calls to avoid hitting quotas
// Gemini free tier: 10 RPM (requests per minute)

interface QueuedRequest<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

export class RateLimiter {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private lastRequestTime = 0;

  constructor(
    private minDelayMs: number = 6000 // 6 seconds between requests (10 per minute)
  ) {}

  /**
   * Add a request to the queue
   */
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      // Wait if we haven't waited long enough since last request
      if (timeSinceLastRequest < this.minDelayMs) {
        await this.sleep(this.minDelayMs - timeSinceLastRequest);
      }

      const request = this.queue.shift();
      if (!request) break;

      try {
        this.lastRequestTime = Date.now();
        const result = await request.fn();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Request cancelled'));
    });
    this.queue = [];
  }

  /**
   * Update the minimum delay between requests
   */
  setDelay(delayMs: number): void {
    this.minDelayMs = delayMs;
  }
}
