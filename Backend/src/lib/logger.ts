import pino from 'pino';
import * as Sentry from '@sentry/node';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }),
});

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: isProduction ? 0.2 : 1.0,
    beforeSend(event) {
      try {
        const requestHeaders = (event.request?.headers ?? {}) as Record<string, string>;
        const scrubHeaderKeys = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token', 'jwt', 'session'];
        for (const headerKey of Object.keys(requestHeaders)) {
          const normalized = headerKey.toLowerCase();
          if (scrubHeaderKeys.includes(normalized)) {
            delete requestHeaders[headerKey];
          }
        }

        if (event.request?.url) {
          try {
            const requestUrl = new URL(event.request.url);
            ['code', 'token', 'access_token', 'refresh_token', 'state', 'jwt', 'session_id', 'authorization'].forEach((param) => {
              requestUrl.searchParams.delete(param);
            });
            event.request.url = requestUrl.toString();
          } catch {
            // ignore malformed URLs; do not leak raw URLs downstream
          }
        }

        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
          delete event.user.username;
          delete event.user.id;
        }

        if (event.extra) {
          const extra = event.extra as Record<string, unknown>;
          const sensitiveExtraKeys = ['accessToken', 'refreshToken', 'clientSecret', 'password', 'token', 'authorization', 'cookie', 'jwt', 'apiKey', 'customerEmail', 'customerName', 'bankAccount', 'routingNumber', 'accountNumber'];
          sensitiveExtraKeys.forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(extra, key)) {
              extra[key] = '[REDACTED]';
            }
          });

          Object.entries(extra).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (typeof value === 'string' && (lowerKey.includes('email') || lowerKey.includes('name') || lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey.includes('password') || lowerKey.includes('account') || lowerKey.includes('routing') || lowerKey.includes('customer') || lowerKey.includes('financial') || lowerKey.includes('bank'))) {
              extra[key] = '[REDACTED]';
            }
          });
        }
      } catch {
        // fail closed: do not send unsafe telemetry
      }

      return event;
    },
  });
  logger.info('Sentry initialized for backend monitoring');
} else {
  logger.info('Sentry DSN not provided; backend will log to local Pino only');
}

export { Sentry };
