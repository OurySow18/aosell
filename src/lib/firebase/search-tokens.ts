export function buildSearchTokens(...parts: Array<string | string[] | undefined>) {
  const flattened = parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gi, ' ');

  const words = flattened
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);

  const tokens = new Set<string>();

  for (const word of words) {
    tokens.add(word);

    for (let index = 2; index <= Math.min(word.length, 8); index += 1) {
      tokens.add(word.slice(0, index));
    }
  }

  return Array.from(tokens).sort();
}
