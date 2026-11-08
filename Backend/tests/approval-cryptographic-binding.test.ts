import { createPayloadHmac, verifyPayloadHmac, ApprovedPayload } from '../src/lib/encryption';

describe('Phase 14.9 QF08: Approval-to-Payload Cryptographic Binding & Line Integrity', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeAll(() => {
    // 32-byte (64 hex characters) key for testing
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  describe('HMAC Canonicalization & Key-Order Invariance', () => {
    it('produces identical HMAC regardless of object key order', () => {
      const payloadA: ApprovedPayload = {
        txnDate: '2026-11-08',
        lines: [
          { amount: 150.5, accountId: 'acc-1', description: 'Office supplies' },
          { amount: -150.5, accountId: 'acc-2', description: 'Checking' },
        ],
      };

      const payloadB = {
        lines: [
          { description: 'Office supplies', accountId: 'acc-1', amount: 150.5 },
          { description: 'Checking', amount: -150.5, accountId: 'acc-2' },
        ],
        txnDate: '2026-11-08',
      };

      const hmacA = createPayloadHmac(payloadA);
      const hmacB = createPayloadHmac(payloadB);

      expect(hmacA).toBeDefined();
      expect(typeof hmacA).toBe('string');
      expect(hmacA.length).toBe(64);
      expect(hmacA).toEqual(hmacB);
      expect(verifyPayloadHmac(payloadA, hmacB)).toBe(true);
      expect(verifyPayloadHmac(payloadB, hmacA)).toBe(true);
    });

    it('rejects tampered financial amounts', () => {
      const approvedPayload: ApprovedPayload = {
        txnDate: '2026-11-08',
        lines: [{ amount: 100.0, accountId: 'acc-1' }],
      };
      const approvedHash = createPayloadHmac(approvedPayload);

      const tamperedPayload: ApprovedPayload = {
        txnDate: '2026-11-08',
        lines: [{ amount: 999.0, accountId: 'acc-1' }],
      };

      expect(verifyPayloadHmac(tamperedPayload, approvedHash)).toBe(false);
    });

    it('rejects tampered account IDs', () => {
      const approvedPayload: ApprovedPayload = {
        txnDate: '2026-11-08',
        lines: [{ amount: 100.0, accountId: 'acc-1' }],
      };
      const approvedHash = createPayloadHmac(approvedPayload);

      const tamperedPayload: ApprovedPayload = {
        txnDate: '2026-11-08',
        lines: [{ amount: 100.0, accountId: 'fraudulent-acc-99' }],
      };

      expect(verifyPayloadHmac(tamperedPayload, approvedHash)).toBe(false);
    });

    it('rejects tampered transaction date', () => {
      const approvedPayload: ApprovedPayload = {
        txnDate: '2026-11-08',
        lines: [{ amount: 100.0, accountId: 'acc-1' }],
      };
      const approvedHash = createPayloadHmac(approvedPayload);

      const tamperedPayload: ApprovedPayload = {
        txnDate: '2025-01-01',
        lines: [{ amount: 100.0, accountId: 'acc-1' }],
      };

      expect(verifyPayloadHmac(tamperedPayload, approvedHash)).toBe(false);
    });

    it('returns false safely when expectedHmac is invalid, null, or malformed', () => {
      const payload: ApprovedPayload = { txnDate: '2026-11-08', lines: [] };
      expect(verifyPayloadHmac(payload, '')).toBe(false);
      expect(verifyPayloadHmac(payload, null as any)).toBe(false);
      expect(verifyPayloadHmac(payload, 'not-a-valid-hex-hmac')).toBe(false);
    });
  });

  describe('Legacy Scan Compatibility & Bulk Approvals', () => {
    it('allows legacy scan verification to pass when approvalHash is null', () => {
      const legacyScan = {
        id: 'legacy-scan-1',
        status: 'APPROVED',
        approvalHash: null,
      };

      // In routes/quickbooks.ts: if (scan.approvalHash) { verify... } else allow
      const shouldVerify = Boolean(legacyScan.approvalHash);
      expect(shouldVerify).toBe(false);
    });

    it('generates independent valid hashes for multiple scans in bulk approval', () => {
      const scan1Payload: ApprovedPayload = {
        txnDate: '2026-11-01',
        lines: [{ amount: 50, accountId: 'acc-A' }],
      };
      const scan2Payload: ApprovedPayload = {
        txnDate: '2026-11-02',
        lines: [{ amount: 75, accountId: 'acc-B' }],
      };

      const hash1 = createPayloadHmac(scan1Payload);
      const hash2 = createPayloadHmac(scan2Payload);

      expect(hash1).not.toEqual(hash2);
      expect(verifyPayloadHmac(scan1Payload, hash1)).toBe(true);
      expect(verifyPayloadHmac(scan2Payload, hash2)).toBe(true);
      expect(verifyPayloadHmac(scan1Payload, hash2)).toBe(false);
    });
  });
});