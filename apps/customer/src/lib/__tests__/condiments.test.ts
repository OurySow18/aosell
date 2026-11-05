import type { Condiment } from '@/types/domain';
import { capitalizeDisplayName, normalizeCondimentText, resolveCondimentEntries } from '@/lib/condiments';

function makeCondiment(overrides: Partial<Condiment> = {}): Condiment {
  return {
    id: 'condiment-1',
    name: 'Piment',
    normalizedName: 'piment',
    aliases: ['pili-pili'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('normalizeCondimentText', () => {
  it('strips accents and lowercases', () => {
    expect(normalizeCondimentText('Poisson fumé')).toBe('poisson fume');
  });

  it('trims and strips trailing punctuation', () => {
    expect(normalizeCondimentText('  Gombo!  ')).toBe('gombo');
  });

  it('collapses hyphens and repeated whitespace into single spaces', () => {
    expect(normalizeCondimentText('huile-de-palme')).toBe('huile de palme');
    expect(normalizeCondimentText('huile   de   palme')).toBe('huile de palme');
  });

  it('strips a trailing plural s when the result stays at least 4 characters', () => {
    expect(normalizeCondimentText('piments')).toBe('piment');
    expect(normalizeCondimentText('oignons')).toBe('oignon');
  });

  it('does not strip a trailing s that would leave fewer than 4 characters', () => {
    expect(normalizeCondimentText('ail')).toBe('ail');
    expect(normalizeCondimentText('ails')).toBe('ail');
  });
});

describe('capitalizeDisplayName', () => {
  it('capitalizes the first letter and trims surrounding whitespace', () => {
    expect(capitalizeDisplayName('  poivre noir  ')).toBe('Poivre noir');
  });
});

describe('resolveCondimentEntries', () => {
  it('matches an existing entry by name, case-insensitively', () => {
    const catalog = [makeCondiment({ name: 'Piment', normalizedName: 'piment' })];
    const { matched, toCreate } = resolveCondimentEntries(['PIMENT'], catalog);

    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe('condiment-1');
    expect(toCreate).toHaveLength(0);
  });

  it('matches via an alias, not just the primary name', () => {
    const catalog = [makeCondiment({ name: 'Piment', normalizedName: 'piment', aliases: ['pili-pili'] })];
    const { matched } = resolveCondimentEntries(['pili pili'], catalog);

    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe('condiment-1');
  });

  it('matches accent-insensitively', () => {
    const catalog = [makeCondiment({ name: 'Poisson fumé', normalizedName: 'poisson fume' })];
    const { matched } = resolveCondimentEntries(['poisson fume'], catalog);

    expect(matched).toHaveLength(1);
  });

  it('matches hyphen/space variants', () => {
    const catalog = [makeCondiment({ name: 'Huile de palme', normalizedName: 'huile de palme' })];
    const { matched } = resolveCondimentEntries(['huile-de-palme'], catalog);

    expect(matched).toHaveLength(1);
  });

  it('matches simple plural variants against a singular catalog entry', () => {
    const catalog = [makeCondiment({ name: 'Oignon', normalizedName: 'oignon' })];
    const { matched } = resolveCondimentEntries(['oignons'], catalog);

    expect(matched).toHaveLength(1);
  });

  it('collapses duplicate near-identical inputs within one batch into a single toCreate entry', () => {
    const { toCreate } = resolveCondimentEntries(['Maggi', 'maggi', ' Maggi '], []);

    expect(toCreate).toHaveLength(1);
    expect(toCreate[0]).toEqual({ normalizedName: 'maggi', displayName: 'Maggi' });
  });

  it('filters out empty and whitespace-only inputs', () => {
    const { matched, toCreate } = resolveCondimentEntries(['', '   ', '\n'], []);

    expect(matched).toHaveLength(0);
    expect(toCreate).toHaveLength(0);
  });

  it('sends everything to toCreate against an empty catalog', () => {
    const { matched, toCreate } = resolveCondimentEntries(['Gingembre', 'Ail'], []);

    expect(matched).toHaveLength(0);
    expect(toCreate).toHaveLength(2);
  });

  it('never lists an already-matched item in toCreate', () => {
    const catalog = [makeCondiment({ name: 'Gombo', normalizedName: 'gombo', aliases: [] })];
    const { matched, toCreate } = resolveCondimentEntries(['Gombo', 'Poivre noir'], catalog);

    expect(matched.map((c) => c.id)).toEqual(['condiment-1']);
    expect(toCreate.map((c) => c.normalizedName)).toEqual(['poivre noir']);
  });
});
