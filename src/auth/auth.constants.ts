/**
 * JWT settings. In a real production app the secret would come ONLY from an
 * environment variable / secrets manager — never hard-coded. The fallback here
 * exists so the demo runs out-of-the-box.
 */
import type { SignOptions } from 'jsonwebtoken';

export const JWT_SECRET =
  process.env.JWT_SECRET ?? 'parkflow-dev-secret-change-in-production';

export const JWT_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) ?? '7d';
