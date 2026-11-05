import type { Cuisine, Dish } from '@/types/domain';
import { stripAccents } from '@/lib/text';

export function slugifyDishName(name: string): string {
  return stripAccents(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function filterDishesByCuisines(dishes: Dish[], cuisines: Cuisine[]): Dish[] {
  if (!cuisines.length) {
    return [];
  }

  return dishes.filter((dish) => cuisines.includes(dish.cuisine));
}
