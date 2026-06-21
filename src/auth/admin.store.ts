import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  isSuperAdmin: boolean;
}

export interface PublicAdmin {
  username: string;
  createdAt: string;
  isSuperAdmin: boolean;
}

/**
 * File-based persistence for admin accounts.
 *
 * The assessment forbids external databases (MySQL / MongoDB), so instead of an
 * in-memory array (which would be lost on restart) we persist admins to a local
 * JSON file that acts as our datastore. Passwords are NEVER stored in plain text —
 * only their bcrypt hashes are written to disk.
 */
@Injectable()
export class AdminStore {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly filePath = path.join(this.dataDir, 'admins.json');
  private admins: Admin[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        this.admins = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      }
    } catch {
      this.admins = [];
    }
  }

  private persist(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.admins, null, 2), 'utf-8');
  }

  count(): number {
    return this.admins.length;
  }

  findByUsername(username: string): Admin | undefined {
    return this.admins.find(
      (a) => a.username.toLowerCase() === username.toLowerCase(),
    );
  }

  add(admin: Admin): void {
    this.admins.push(admin);
    this.persist();
  }

  delete(username: string): void {
    this.admins = this.admins.filter(
      (a) => a.username.toLowerCase() !== username.toLowerCase(),
    );
    this.persist();
  }

  list(): PublicAdmin[] {
    return this.admins.map((a) => ({
      username: a.username,
      createdAt: a.createdAt,
      isSuperAdmin: a.isSuperAdmin,
    }));
  }
}
