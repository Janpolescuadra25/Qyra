import { resolveSafeReturnUrl } from '../src/routes/checkout';

describe('resolveSafeReturnUrl (Phase 12 Deliverable 12.1)', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;

  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://qyra.space';
  });

  afterAll(() => {
    process.env.FRONTEND_URL = originalFrontendUrl;
  });

  it('falls back to default settings URL when returnUrl is undefined, null, empty, or non-string', () => {
    expect(resolveSafeReturnUrl()).toBe('https://qyra.space/settings');
    expect(resolveSafeReturnUrl(null)).toBe('https://qyra.space/settings');
    expect(resolveSafeReturnUrl('')).toBe('https://qyra.space/settings');
    expect(resolveSafeReturnUrl(12345)).toBe('https://qyra.space/settings');
    expect(resolveSafeReturnUrl({})).toBe('https://qyra.space/settings');
  });

  it('accepts candidate URLs matching FRONTEND_URL origin', () => {
    const candidate = 'https://qyra.space/dashboard?tab=billing';
    expect(resolveSafeReturnUrl(candidate)).toBe(candidate);
  });

  it('accepts candidate URLs matching www.qyra.space', () => {
    const candidate = 'https://www.qyra.space/settings/billing';
    expect(resolveSafeReturnUrl(candidate)).toBe(candidate);
  });

  it('accepts candidate URLs matching published Chrome extension origin', () => {
    const candidate = 'chrome-extension://bfhobnahngcmhaeklihifgfbgdepibii/options.html#billing';
    expect(resolveSafeReturnUrl(candidate)).toBe(candidate);
  });

  it('falls back to default settings URL for untrusted external origins (open redirect protection)', () => {
    const phishingCandidate = 'https://evil-phishing-attacker.com/harvest-tokens';
    expect(resolveSafeReturnUrl(phishingCandidate)).toBe('https://qyra.space/settings');
  });

  it('falls back to default settings URL for unsafe schemes (javascript, data, file)', () => {
    expect(resolveSafeReturnUrl('javascript:alert(1)')).toBe('https://qyra.space/settings');
    expect(resolveSafeReturnUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('https://qyra.space/settings');
    expect(resolveSafeReturnUrl('file:///etc/passwd')).toBe('https://qyra.space/settings');
  });

  it('falls back to default settings URL for malformed string inputs', () => {
    expect(resolveSafeReturnUrl('htp:/bad-url')).toBe('https://qyra.space/settings');
    expect(resolveSafeReturnUrl('://invalid')).toBe('https://qyra.space/settings');
  });
});
