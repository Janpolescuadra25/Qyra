import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/index';

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
