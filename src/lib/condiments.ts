import type { Condiment } from '@/types/domain';
import { stripAccents } from '@/lib/text';

export function normalizeCondimentText(input: string): string {
  const base = stripAccents(input)
    .toLowerCase()
    .trim()
    .replace(/[.,;!?]+$/g, '')
    .replace(/[-\s]+/g, ' ')
    .trim();

  if (base.length >= 4 && base.endsWith('s')) {
    return base.slice(0, -1);
  }

  return base;
}

export function capitalizeDisplayName(input: string): string {
  const trimmed = input.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export type CondimentResolution = {
  matched: Condiment[];
  toCreate: { normalizedName: string; displayName: string }[];
};

export function resolveCondimentEntries(
  rawInputs: string[],
  catalog: Condiment[],
): CondimentResolution {
  const matched = new Map<string, Condiment>();
  const toCreate = new Map<string, string>();

  for (const raw of rawInputs) {
    const normalized = normalizeCondimentText(raw);
    if (!normalized) {
      continue;
    }

    const existing = catalog.find(
      (condiment) =>
        condiment.normalizedName === normalized ||
        condiment.aliases.some((alias) => normalizeCondimentText(alias) === normalized),
    );

    if (existing) {
      matched.set(existing.id, existing);
      continue;
    }

    if (!toCreate.has(normalized)) {
      toCreate.set(normalized, capitalizeDisplayName(raw.trim()));
    }
  }

  return {
    matched: Array.from(matched.values()),
    toCreate: Array.from(toCreate.entries()).map(([normalizedName, displayName]) => ({
      normalizedName,
      displayName,
    })),
  };
}
