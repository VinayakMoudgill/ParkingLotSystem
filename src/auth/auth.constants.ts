/**
 * JWT settings. In a real production app the secret would come ONLY from an
 * environment variable / secrets manager — never hard-coded. The fallback here
 * exists so the demo runs out-of-the-box.
 */
export const JWT_SECRET =
  process.env.JWT_SECRET ?? 'parkflow-dev-secret-change-in-production';

export const JWT_EXPIRES_IN = '2h';
