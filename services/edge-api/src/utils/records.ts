export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getMutableRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) && !Array.isArray(value) ? { ...value } : null;
}

export function getNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function removeEmptyStrings<T>(value: T): T {
  if (typeof value === 'string') {
    return value.trim() ? value : undefined as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => removeEmptyStrings(item)).filter((item) => item !== undefined) as T;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => typeof entryValue !== 'string' || entryValue.trim() !== '')
      .map(([key, entryValue]) => [key, removeEmptyStrings(entryValue)])
      .filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

export function getStringFromRecord(record: Record<string, unknown> | undefined, key: string): string | null {
  if (!record) {
    return null;
  }

  const value = record[key];

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  for (const nestedValue of Object.values(record)) {
    if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
      const nestedMatch: string | null = getStringFromRecord(nestedValue as Record<string, unknown>, key);

      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return null;
}
