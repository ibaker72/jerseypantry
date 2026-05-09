const CATEGORY_FALLBACK: Record<string, string> = {
  'drinks': 'https://placehold.co/400x400/0077b6/ffffff?text=Drink',
  'energy-hydration': 'https://placehold.co/400x400/1a1f2e/e8600a?text=Energy',
  'chips-salty-snacks': 'https://placehold.co/400x400/e8600a/ffffff?text=Snack',
  'candy-chocolate': 'https://placehold.co/400x400/c9184a/ffffff?text=Candy',
  'cookies-sweets': 'https://placehold.co/400x400/c9184a/ffffff?text=Candy',
  'coffee-tea': 'https://placehold.co/400x400/3d1a00/ffffff?text=Coffee',
  'middle-eastern-favorites': 'https://placehold.co/400x400/1e4d2b/ffffff?text=ME+Specialty',
  'household-essentials': 'https://placehold.co/400x400/023e8a/ffffff?text=Household',
  'personal-care': 'https://placehold.co/400x400/023e8a/ffffff?text=Household',
  'bundles': 'https://placehold.co/400x400/1a1f2e/e8600a?text=Bundle',
  'office-refill': 'https://placehold.co/400x400/1a1f2e/e8600a?text=Bundle',
  'local-delivery-deals': 'https://placehold.co/400x400/0077b6/ffffff?text=Drink',
}

const DEFAULT_FALLBACK =
  'https://placehold.co/400x400/1a1f2e/e8600a?text=My+Corner+Store'

export function getCategoryFallback(categorySlug?: string | null): string {
  if (!categorySlug) return DEFAULT_FALLBACK
  return CATEGORY_FALLBACK[categorySlug] ?? DEFAULT_FALLBACK
}
