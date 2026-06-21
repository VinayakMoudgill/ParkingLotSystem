import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Admin, AdminStore, PublicAdmin } from './admin.store';

export interface AuthToken {
  access_token: string;
  username: string;
  isSuperAdmin: boolean;
}

/** Minimal info about whoever is making a privileged request. */
export interface Requester {
  isSuperAdmin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly store: AdminStore,
    private readonly jwt: JwtService,
  ) {}

  /** Has the system been bootstrapped with at least one admin? */
  hasAdmin(): boolean {
    return this.store.count() > 0;
  }

  /**
   * Register an admin.
   *  - If NO admin exists yet, anyone may create the very first admin, who
   *    automatically becomes the SUPER ADMIN (bootstrap).
   *  - Once an admin exists, ONLY the super admin may create more admins,
   *    and those are regular (non-super) admins.
   */
  async register(
    username: string,
    password: string,
    requester: Requester | null,
  ): Promise<AuthToken> {
    const bootstrapping = !this.hasAdmin();

    if (!bootstrapping && (!requester || !requester.isSuperAdmin)) {
      throw new ForbiddenException('Only the super admin can create new admins');
    }
    if (this.store.findByUsername(username)) {
      throw new ConflictException(`Admin "${username}" already exists`);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin: Admin = {
      id: randomUUID(),
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
      isSuperAdmin: bootstrapping, // the first admin is the super admin
    };
    this.store.add(admin);
    return this.sign(admin);
  }

  /** Verify credentials and return a signed JWT. */
  async login(username: string, password: string): Promise<AuthToken> {
    const admin = this.store.findByUsername(username);
    if (!admin) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return this.sign(admin);
  }

  /** Remove an admin. Only the super admin may do this; the super admin itself is protected. */
  removeAdmin(targetUsername: string, requester: Requester): { removed: string } {
    if (!requester.isSuperAdmin) {
      throw new ForbiddenException('Only the super admin can remove admins');
    }
    const target = this.store.findByUsername(targetUsername);
    if (!target) {
      throw new NotFoundException(`Admin "${targetUsername}" not found`);
    }
    if (target.isSuperAdmin) {
      throw new ForbiddenException('The super admin cannot be removed');
    }
    this.store.delete(target.username);
    return { removed: target.username };
  }

  listAdmins(): PublicAdmin[] {
    return this.store.list();
  }

  private sign(admin: Admin): AuthToken {
    const payload = {
      sub: admin.id,
      username: admin.username,
      isSuperAdmin: admin.isSuperAdmin,
    };
    return {
      access_token: this.jwt.sign(payload),
      username: admin.username,
      isSuperAdmin: admin.isSuperAdmin,
    };
  }
}
