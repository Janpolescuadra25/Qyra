import { describe, it, expect, afterEach } from '@jest/globals';
import request from 'supertest';
import app, { getAllowedOrigins, getAllowedExtensionIds } from '../src/index';

describe('Phase 14.5: CORS Security & Origin Whitelist Tests', () => {
  it('allows request with no origin (e.g. server-side/curl/health-check)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('allows production web origin https://qyra.space', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://qyra.space');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://qyra.space');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows production web origin https://www.qyra.space', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://www.qyra.space');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://www.qyra.space');
  });

  it('allows local development origin http://localhost:3000', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('allows published Chrome Web Store extension', async () => {
    const approvedOrigin = 'chrome-extension://bfhobnahngcmhaeklihifgfbgdepibii';
    const res = await request(app)
      .get('/health')
      .set('Origin', approvedOrigin);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(approvedOrigin);
  });

  it('allows registered unpacked dev extension', async () => {
    const approvedOrigin = 'chrome-extension://ccghhfmkjbcakhnoamgihifonfiammoc';
    const res = await request(app)
      .get('/health')
      .set('Origin', approvedOrigin);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(approvedOrigin);
  });

  it('rejects unauthorized Chrome extension origin', async () => {
    const maliciousOrigin = 'chrome-extension://maliciousattackerfakeextensionid12345';
    const res = await request(app)
      .get('/health')
      .set('Origin', maliciousOrigin);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects unapproved external domain origin', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://malicious-site.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects unapproved subdomain of qyra.space', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://attacker.qyra.space');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Phase 15.2: Production CORS Origin & Extension Hardening (QF23)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowedExtensionId = process.env.ALLOWED_EXTENSION_ID;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalAllowedExtensionId === undefined) {
      delete process.env.ALLOWED_EXTENSION_ID;
    } else {
      process.env.ALLOWED_EXTENSION_ID = originalAllowedExtensionId;
    }
  });

  it('returns only production origins in production mode and trims configured IDs', () => {
    expect(getAllowedOrigins('production')).toEqual([
      'https://qyra.space',
      'https://api.qyra.space',
      'https://www.qyra.space',
    ]);

    expect(getAllowedExtensionIds({
      NODE_ENV: 'production',
      ALLOWED_EXTENSION_ID: ' custom-a , , custom-b  ',
    })).toEqual([
      'bfhobnahngcmhaeklihifgfbgdepibii',
      'custom-a',
      'custom-b',
    ]);
  });

  it('rejects localhost and dev extension origins in production mode', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOWED_EXTENSION_ID;

    const localhost3000 = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');
    expect(localhost3000.headers['access-control-allow-origin']).toBeUndefined();

    const localhost5173 = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');
    expect(localhost5173.headers['access-control-allow-origin']).toBeUndefined();

    const devExtension = await request(app)
      .get('/health')
      .set('Origin', 'chrome-extension://ccghhfmkjbcakhnoamgihifonfiammoc');
    expect(devExtension.headers['access-control-allow-origin']).toBeUndefined();

    const prodOrigin = await request(app)
      .get('/health')
      .set('Origin', 'https://qyra.space');
    expect(prodOrigin.status).toBe(200);
    expect(prodOrigin.headers['access-control-allow-origin']).toBe('https://qyra.space');
  });

  it('allows production origins and configured extension IDs in production mode', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_EXTENSION_ID = 'custom-prod-ext';

    const prodOrigin = await request(app)
      .get('/health')
      .set('Origin', 'https://www.qyra.space');
    expect(prodOrigin.status).toBe(200);
    expect(prodOrigin.headers['access-control-allow-origin']).toBe('https://www.qyra.space');

    const prodExt = await request(app)
      .get('/health')
      .set('Origin', 'chrome-extension://bfhobnahngcmhaeklihifgfbgdepibii');
    expect(prodExt.status).toBe(200);
    expect(prodExt.headers['access-control-allow-origin']).toBe('chrome-extension://bfhobnahngcmhaeklihifgfbgdepibii');

    const overrideExt = await request(app)
      .get('/health')
      .set('Origin', 'chrome-extension://custom-prod-ext');
    expect(overrideExt.status).toBe(200);
    expect(overrideExt.headers['access-control-allow-origin']).toBe('chrome-extension://custom-prod-ext');
  });
});
