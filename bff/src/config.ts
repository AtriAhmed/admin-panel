import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');

    process.env[key] ??= value;
  }
}

loadDotEnv();

export const config = {
  port: Number(process.env.PORT ?? 8787),
  host: process.env.HOST ?? '0.0.0.0',
  zitadelApiBase: (process.env.ZITADEL_API_BASE ?? 'https://ahmeds-auth-qaw8wn.eu1.zitadel.cloud')
    .trim()
    .replace(/\/$/, ''),
  zitadelServiceToken: process.env.ZITADEL_SERVICE_TOKEN,
  zitadelOrganizationId: process.env.ZITADEL_ORGANIZATION_ID,
  passkeyDomain: process.env.ZITADEL_PASSKEY_DOMAIN || process.env.PASSKEY_DOMAIN,
  idpIds: {
    google: process.env.ZITADEL_GOOGLE_IDP_ID,
    apple: process.env.ZITADEL_APPLE_IDP_ID,
  },
};
