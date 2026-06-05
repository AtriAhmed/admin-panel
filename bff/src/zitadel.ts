import { config } from './config.js';
import type { ZitadelGetSessionResponse } from './types.js';

export async function getZitadelSession(sessionId: string, sessionToken: string) {
  const searchParams = new URLSearchParams({ sessionToken });

  return zitadelJson<ZitadelGetSessionResponse>(
    `/v2/sessions/${encodeURIComponent(sessionId)}?${searchParams.toString()}`
  );
}

export async function deleteZitadelSession(sessionId: string, sessionToken: string) {
  await zitadelJson(`/v2/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    body: {
      sessionToken,
    },
  });
}

export async function zitadelJson<T = unknown>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<T> {
  if (!config.zitadelServiceToken) {
    throw new Error('ZITADEL_SERVICE_TOKEN is not configured.');
  }

  const response = await fetch(`${config.zitadelApiBase}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.zitadelServiceToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = await response.text();
  const data = body ? JSON.parse(body) : null;

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error_description ||
      data?.error ||
      `ZITADEL request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data as T;
}
