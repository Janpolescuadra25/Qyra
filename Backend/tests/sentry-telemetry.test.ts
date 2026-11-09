import type { Event as SentryEvent } from '@sentry/node';

describe('Sentry Telemetry & Sensitive Data Sanitization (Phase 14.1)', () => {
  const scrubHeaderKeys = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token', 'jwt', 'session'];

  function sanitizeSentryEvent(event: SentryEvent): SentryEvent | null {
    try {
      const requestHeaders = (event.request?.headers ?? {}) as Record<string, string>;
      for (const headerKey of Object.keys(requestHeaders)) {
        const normalized = headerKey.toLowerCase();
        if (scrubHeaderKeys.includes(normalized)) {
          delete requestHeaders[headerKey];
        }
      }
      return event;
    } catch {
      return null;
    }
  }

  it('should strip sensitive authentication and session headers', () => {
    const rawEvent: SentryEvent = {
      request: {
        headers: {
          authorization: 'Bearer sk_live_secret_token_12345',
          cookie: 'session_id=abcdef123456; Path=/',
          'set-cookie': 'jwt=eyJhbGciOi...; HttpOnly',
          'x-api-key': 'qyra_live_key_xyz',
          'x-auth-token': 'auth_token_987',
          jwt: 'raw.jwt.token',
          session: 'active_session_token',
          'content-type': 'application/json',
          accept: 'application/json',
          'user-agent': 'Qyra-Extension/1.0',
        },
      },
    };

    const sanitized = sanitizeSentryEvent(rawEvent);
    expect(sanitized).not.toBeNull();
    const headers = sanitized!.request!.headers!;

    for (const key of scrubHeaderKeys) {
      expect(headers[key]).toBeUndefined();
    }

    expect(headers['content-type']).toBe('application/json');
    expect(headers['accept']).toBe('application/json');
    expect(headers['user-agent']).toBe('Qyra-Extension/1.0');
  });

  it('should strip mixed-case sensitive header keys', () => {
    const rawEvent: SentryEvent = {
      request: {
        headers: {
          Authorization: 'Bearer token',
          Cookie: 'session=1',
          'X-Api-Key': 'secret',
          'Content-Type': 'application/json',
        },
      },
    };

    const sanitized = sanitizeSentryEvent(rawEvent);
    expect(sanitized).not.toBeNull();
    const headers = sanitized!.request!.headers!;

    expect(headers['Authorization']).toBeUndefined();
    expect(headers['Cookie']).toBeUndefined();
    expect(headers['X-Api-Key']).toBeUndefined();
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should fail closed and return null if sanitization encounters an unexpected exception', () => {
    const brokenEvent = {
      get request() {
        throw new Error('Corrupted request object');
      },
    } as unknown as SentryEvent;

    const result = sanitizeSentryEvent(brokenEvent);
    expect(result).toBeNull();
  });

  it('should handle events without request or headers gracefully', () => {
    const eventWithoutRequest: SentryEvent = {
      message: 'Pure backend service error',
      level: 'error',
    };

    const sanitized = sanitizeSentryEvent(eventWithoutRequest);
    expect(sanitized).not.toBeNull();
    expect(sanitized!.message).toBe('Pure backend service error');
  });
});
