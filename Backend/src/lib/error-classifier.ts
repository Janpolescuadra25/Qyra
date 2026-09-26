/**
 * Classifies whether a QuickBooks sync error is transient (eligible for retry)
 * or permanent (invalid payload, authorization error, or validation issue).
 */
export function isTransientSyncError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const candidate = error as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
    message?: string;
    code?: string;
    errno?: string;
    error?: { message?: string };
    cause?: { code?: string; message?: string };
  };

  const status = candidate.status ?? candidate.statusCode ?? candidate.response?.status;
  const message = [
    candidate.message,
    candidate.error?.message,
    candidate.cause?.message,
  ].filter((part): part is string => Boolean(part)).join(' ').toLowerCase();
  const code = (candidate.code ?? candidate.errno ?? candidate.cause?.code ?? '').toLowerCase();

  if ([408, 429, 502, 503, 504].includes(Number(status ?? 0))) {
    return true;
  }

  const networkCodes = new Set([
    'econnreset',
    'etimedout',
    'econnrefused',
    'enotfound',
    'epipe',
    'esockettimedout',
    'eai_again',
    'und_err_socket',
    'networkerror',
  ]);

  if (code && networkCodes.has(code)) {
    return true;
  }

  const transientPatterns = [
    'throttled',
    'rate limit',
    'too many requests',
    'timeout',
    'timed out',
    'service unavailable',
    'server busy',
    'bad gateway',
    'gateway timeout',
    'temporarily unavailable',
    'connection reset',
    'network error',
  ];

  return transientPatterns.some((pattern) => message.includes(pattern));
}
