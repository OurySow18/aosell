import type { Dish } from '@/types/domain';
import { filterDishesByCuisines, slugifyDishName } from '@/lib/dishes';

function makeDish(overrides: Partial<Dish> = {}): Dish {
  return {
    id: 'dish-1',
    cuisine: 'senegalese',
    name: 'Thieboudienne',
    slug: 'thieboudienne',
    description: 'Rice, fish, and vegetables in a tamarind-tomato sauce.',
    defaultCondimentIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('slugifyDishName', () => {
  it('strips accents, lowercases, and hyphenates', () => {
    expect(slugifyDishName('Poulet Moambe')).toBe('poulet-moambe');
  });

  it('strips punctuation and collapses separators', () => {
    expect(slugifyDishName("Soupe Kandia !")).toBe('soupe-kandia');
  });
});

describe('filterDishesByCuisines', () => {
  it('returns only dishes whose cuisine is in the given list', () => {
    const dishes = [
      makeDish({ id: 'a', cuisine: 'senegalese' }),
      makeDish({ id: 'b', cuisine: 'guinean' }),
      makeDish({ id: 'c', cuisine: 'ivorian' }),
    ];

    expect(filterDishesByCuisines(dishes, ['senegalese', 'guinean']).map((d) => d.id)).toEqual(['a', 'b']);
  });

  it('returns an empty list when given an empty cuisine list', () => {
    const dishes = [makeDish({ id: 'a', cuisine: 'senegalese' })];
    expect(filterDishesByCuisines(dishes, [])).toEqual([]);
  });
});
