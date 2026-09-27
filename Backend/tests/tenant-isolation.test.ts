import { locationFilter } from '../src/middleware/auth.middleware';

describe('Tenant Isolation & Location Filter', () => {
  it('returns empty filter for OWNER role allowing full access', () => {
    const mockOwner: any = { id: 'owner_1', role: 'OWNER' };
    const filter = locationFilter(mockOwner);
    expect(filter).toEqual({});
  });

  it('returns adminId filter matching user.userId for ADMIN role', () => {
    const mockAdmin: any = { id: 'admin_1', userId: 'admin_1', role: 'ADMIN' };
    const filter = locationFilter(mockAdmin);
    expect(filter).toEqual({ adminId: 'admin_1' });
  });

  it('returns adminId filter matching user.userId for MANAGER role', () => {
    const mockManager: any = { id: 'mgr_1', userId: 'mgr_1', role: 'MANAGER' };
    const filter = locationFilter(mockManager);
    expect(filter).toEqual({ adminId: 'mgr_1' });
  });

  it('returns adminId filter for sub-users with adminId assigned', () => {
    const mockSubUser: any = { id: 'user_1', role: 'MEMBER', adminId: 'admin_1' };
    const filter = locationFilter(mockSubUser);
    expect(filter).toEqual({ adminId: 'admin_1' });
  });

  it('prevents cross-tenant access between different admin tenants', () => {
    const adminA: any = { id: 'admin_A', userId: 'admin_A', role: 'ADMIN' };
    const adminB: any = { id: 'admin_B', userId: 'admin_B', role: 'ADMIN' };

    const filterA = locationFilter(adminA);
    const filterB = locationFilter(adminB);

    expect(filterA.adminId).not.toEqual(filterB.adminId);
  });
});
