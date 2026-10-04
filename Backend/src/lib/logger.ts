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
  });
  logger.info('Sentry initialized for backend monitoring');
} else {
  logger.info('Sentry DSN not provided; backend will log to local Pino only');
}

export { Sentry };
