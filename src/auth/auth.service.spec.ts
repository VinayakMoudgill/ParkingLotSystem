import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Admin, PublicAdmin } from './admin.store';

// A lightweight in-memory fake of AdminStore so tests never touch the filesystem
function makeFakeStore() {
  let admins: Admin[] = [];
  return {
    count: () => admins.length,
    findByUsername: (u: string) =>
      admins.find((a) => a.username.toLowerCase() === u.toLowerCase()),
    add: (a: Admin) => admins.push(a),
    delete: (u: string) => {
      admins = admins.filter((a) => a.username.toLowerCase() !== u.toLowerCase());
    },
    list: (): PublicAdmin[] =>
      admins.map((a) => ({
        username: a.username,
        createdAt: a.createdAt,
        isSuperAdmin: a.isSuperAdmin,
      })),
  };
}

const SUPER = { isSuperAdmin: true };
const REGULAR = { isSuperAdmin: false };

describe('AuthService', () => {
  let service: AuthService;
  let store: ReturnType<typeof makeFakeStore>;

  beforeEach(() => {
    store = makeFakeStore();
    const jwt = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '1h' } });
    service = new AuthService(store as any, jwt);
  });

  it('reports no admin before bootstrap', () => {
    expect(service.hasAdmin()).toBe(false);
  });

  it('makes the FIRST admin the super admin (bootstrap, no requester)', async () => {
    const res = await service.register('root', 'secret123', null);
    expect(res.username).toBe('root');
    expect(res.isSuperAdmin).toBe(true);
    expect(res.access_token).toEqual(expect.any(String));
    expect(service.hasAdmin()).toBe(true);
  });

  it('blocks creating a second admin with no requester', async () => {
    await service.register('root', 'secret123', null);
    await expect(service.register('second', 'secret123', null)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('blocks a NON-super admin from creating admins', async () => {
    await service.register('root', 'secret123', null);
    await expect(service.register('second', 'secret123', REGULAR)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('lets the super admin create more (regular) admins', async () => {
    await service.register('root', 'secret123', null);
    const res = await service.register('second', 'secret123', SUPER);
    expect(res.isSuperAdmin).toBe(false);
    expect(service.listAdmins()).toHaveLength(2);
  });

  it('rejects duplicate usernames (case-insensitive)', async () => {
    await service.register('root', 'secret123', null);
    await expect(service.register('ROOT', 'secret123', SUPER)).rejects.toThrow(
      ConflictException,
    );
  });

  it('logs in with correct credentials and reports the role', async () => {
    await service.register('root', 'secret123', null);
    const res = await service.login('root', 'secret123');
    expect(res.isSuperAdmin).toBe(true);
    expect(res.access_token).toEqual(expect.any(String));
  });

  it('rejects login with a wrong password', async () => {
    await service.register('root', 'secret123', null);
    await expect(service.login('root', 'wrongpass')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects login for an unknown user', async () => {
    await expect(service.login('ghost', 'whatever')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ─── Remove admin ────────────────────────────────────────────────────────

  it('lets the super admin remove a regular admin', async () => {
    await service.register('root', 'secret123', null);
    await service.register('temp', 'secret123', SUPER);
    expect(service.removeAdmin('temp', SUPER)).toEqual({ removed: 'temp' });
    expect(service.listAdmins()).toHaveLength(1);
  });

  it('blocks a non-super admin from removing admins', async () => {
    await service.register('root', 'secret123', null);
    await service.register('temp', 'secret123', SUPER);
    expect(() => service.removeAdmin('temp', REGULAR)).toThrow(ForbiddenException);
  });

  it('protects the super admin from being removed', async () => {
    await service.register('root', 'secret123', null);
    expect(() => service.removeAdmin('root', SUPER)).toThrow(ForbiddenException);
  });

  it('throws NotFound when removing a non-existent admin', async () => {
    await service.register('root', 'secret123', null);
    expect(() => service.removeAdmin('ghost', SUPER)).toThrow(NotFoundException);
  });
});
