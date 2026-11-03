import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { QBApiError } from '../src/lib/qb-errors';

const mockPrisma = {
  qBToken: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
    upsert: jest.fn() as jest.MockedFunction<any>,
  },
  oAuthState: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
    delete: jest.fn() as jest.MockedFunction<any>,
    create: jest.fn() as jest.MockedFunction<any>,
  },
};

jest.mock('../src/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../src/lib/encryption', () => ({
  encrypt: jest.fn((val: string) => `enc_${val}`),
  decryptSafe: jest.fn((val: string) => (val ? val.replace(/^enc_/, '') : null)),
}));

const mockFetch = jest.fn() as jest.MockedFunction<any>;
(global as any).fetch = mockFetch;

process.env.QB_CLIENT_ID = 'mock-qb-client-id';
process.env.QB_CLIENT_SECRET = 'mock-qb-client-secret';
process.env.QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
process.env.QB_API_BASE_URL = 'https://quickbooks.api.intuit.com/v3/company';

describe('QuickBooks Service: Token Refresh Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    mockPrisma.qBToken.findUnique.mockReset();
    mockPrisma.qBToken.update.mockReset();
    mockPrisma.oAuthState.findUnique.mockReset();
    mockPrisma.oAuthState.delete.mockReset();
    mockPrisma.oAuthState.create.mockReset();
    process.env.QB_CLIENT_ID = 'mock-qb-client-id';
    process.env.QB_CLIENT_SECRET = 'mock-qb-client-secret';
    process.env.QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    process.env.QB_API_BASE_URL = 'https://quickbooks.api.intuit.com/v3/company';
  });

  it('refreshAccessToken exchanges a refresh token for a fresh access token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'fresh-access-token',
        refresh_token: 'fresh-refresh-token',
        expires_in: 3600,
      }),
      text: async () => '',
    });

    const { qbService } = await import('../src/services/qb.service');
    const result = await qbService.refreshAccessToken('old-refresh-token');

    expect(result).toEqual({
      accessToken: 'fresh-access-token',
      refreshToken: 'fresh-refresh-token',
      expiresIn: 3600,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Basic '),
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
    );
  });

  it('proactively refreshes an expired access token in the token lifecycle', async () => {
    const expiredDate = new Date(Date.now() - 3600000);
    const mockQBToken = {
      id: 'qb-token-1',
      userId: 'user-123',
      realmId: 'realm-456',
      accessToken: 'enc_old-access-token',
      refreshToken: 'enc_old-refresh-token',
      expiresAt: expiredDate,
      stale: false,
    };

    mockPrisma.qBToken.findUnique.mockResolvedValueOnce(mockQBToken);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      }),
      text: async () => '',
    });
    mockPrisma.qBToken.update.mockResolvedValueOnce({
      ...mockQBToken,
      accessToken: 'enc_new-access-token',
      refreshToken: 'enc_new-refresh-token',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      stale: false,
    });

    const { qbService } = await import('../src/services/qb.service');
    const token = await qbService.callQB('user-123', async ({ accessToken }) => accessToken);

    expect(token).toBe('new-access-token');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockPrisma.qBToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123' },
        data: expect.objectContaining({
          accessToken: 'enc_new-access-token',
          refreshToken: 'enc_new-refresh-token',
          stale: false,
        }),
      })
    );
  });

  it('retries a 401 from callQB by forcing a fresh token and re-running the request', async () => {
    const futureDate = new Date(Date.now() + 3600000);
    const mockQBToken = {
      id: 'qb-token-1',
      userId: 'user-123',
      realmId: 'realm-456',
      accessToken: 'enc_valid-access-token',
      refreshToken: 'enc_valid-refresh-token',
      expiresAt: futureDate,
      stale: false,
    };

    mockPrisma.qBToken.findUnique
      .mockResolvedValueOnce(mockQBToken)
      .mockResolvedValueOnce({
        ...mockQBToken,
        accessToken: 'enc_new-access-token',
        refreshToken: 'enc_new-refresh-token',
      });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      }),
      text: async () => '',
    });

    const { qbService } = await import('../src/services/qb.service');

    const result = await qbService.callQB('user-123', async ({ accessToken }) => {
      if (accessToken === 'valid-access-token') {
        throw new QBApiError('Unauthorized', 401);
      }
      return accessToken;
    });

    expect(result).toBe('new-access-token');
    expect(mockPrisma.qBToken.findUnique).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent refreshes for the same user while the token is expired', async () => {
    const expiredDate = new Date(Date.now() - 3600000);
    const mockQBToken = {
      id: 'qb-token-1',
      userId: 'user-123',
      realmId: 'realm-456',
      accessToken: 'enc_expired-access-token',
      refreshToken: 'enc_expired-refresh-token',
      expiresAt: expiredDate,
      stale: false,
    };

    mockPrisma.qBToken.findUnique.mockResolvedValue(mockQBToken);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'deduped-access-token',
        refresh_token: 'deduped-refresh-token',
        expires_in: 3600,
      }),
      text: async () => '',
    });
    mockPrisma.qBToken.update.mockResolvedValue({
      ...mockQBToken,
      accessToken: 'enc_deduped-access-token',
      refreshToken: 'enc_deduped-refresh-token',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      stale: false,
    });

    const { qbService } = await import('../src/services/qb.service');

    const [first, second] = await Promise.all([
      qbService.callQB('user-123', async ({ accessToken }) => accessToken),
      qbService.callQB('user-123', async ({ accessToken }) => accessToken),
    ]);

    expect(first).toBe('deduped-access-token');
    expect(second).toBe('deduped-access-token');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('marks a token as stale when the refresh attempt fails with invalid grant', async () => {
    const expiredDate = new Date(Date.now() - 3600000);
    const mockQBToken = {
      id: 'qb-token-1',
      userId: 'user-123',
      realmId: 'realm-456',
      accessToken: 'enc_old-access-token',
      refreshToken: 'enc_bad-refresh-token',
      expiresAt: expiredDate,
      stale: false,
    };

    mockPrisma.qBToken.findUnique.mockResolvedValueOnce(mockQBToken);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => '{"error":"invalid_grant"}',
    });
    mockPrisma.qBToken.update.mockResolvedValueOnce({
      ...mockQBToken,
      stale: true,
    });

    const { qbService } = await import('../src/services/qb.service');

    await expect(
      qbService.callQB('user-123', async ({ accessToken }) => accessToken)
    ).rejects.toThrow();

    expect(mockPrisma.qBToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123' },
        data: expect.objectContaining({ stale: true }),
      })
    );
  });

  it('returns the active access token immediately when it is still valid', async () => {
    const futureDate = new Date(Date.now() + 3600000);
    const mockQBToken = {
      id: 'qb-token-1',
      userId: 'user-123',
      realmId: 'realm-456',
      accessToken: 'enc_valid-access-token',
      refreshToken: 'enc_valid-refresh-token',
      expiresAt: futureDate,
      stale: false,
    };

    mockPrisma.qBToken.findUnique.mockResolvedValueOnce(mockQBToken);

    const { qbService } = await import('../src/services/qb.service');
    const token = await qbService.callQB('user-123', async ({ accessToken }) => accessToken);

    expect(token).toBe('valid-access-token');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPrisma.qBToken.update).not.toHaveBeenCalled();
  });
});
