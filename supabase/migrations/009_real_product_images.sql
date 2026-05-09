-- ============================================================
-- Migration 009: Replace placeholder images with real product
-- images from Open Food Facts CDN, falling back to colored
-- category placeholders for products without a real image.
-- ============================================================

-- ---------- DRINKS ----------
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/004/900/003/2921/front_en.jpg' where slug = 'coca-cola-20oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/001/200/000/0133/front_en.jpg' where slug = 'pepsi-20oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/007/698/000/0722/front_en.jpg' where slug = 'snapple-peach-tea-16oz';
update public.products set image_url = 'https://placehold.co/400x400/0077b6/ffffff?text=Drink' where slug in (
  'poland-spring-water-169oz',
  'sprite-20oz',
  'arizona-iced-tea-23oz',
  'vitaminwater-xxx-20oz'
);

-- ---------- ENERGY & HYDRATION ----------
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/901/127/400/1198/front_en.jpg' where slug = 'red-bull-energy-84oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/008/571/402/0154/front_en.jpg' where slug = 'celsius-energy-drink-12oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/070/847/028/1956/front_en.jpg' where slug = 'monster-energy-green-16oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/005/200/002/2292/front_en.jpg' where slug = 'gatorade-cool-blue-20oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/634/049/400/0002/front_en.jpg' where slug = 'prime-hydration-blue-raspberry';
update public.products set image_url = 'https://placehold.co/400x400/1a1f2e/e8600a?text=Energy' where slug = 'bodyarmor-fruit-punch-16oz';

-- ---------- CHIPS & SALTY SNACKS ----------
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/001/200/012/0475/front_en.jpg' where slug = 'takis-fuego-99oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/002/840/000/9095/front_en.jpg' where slug = 'doritos-nacho-cheese-275oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/002/840/004/1858/front_en.jpg' where slug = 'flamin-hot-cheetos-325oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/002/840/000/9040/front_en.jpg' where slug = 'lays-classic-2625oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/003/800/031/9448/front_en.jpg' where slug = 'pringles-original-52oz';
update public.products set image_url = 'https://placehold.co/400x400/e8600a/ffffff?text=Snack' where slug in (
  'hot-fries-1oz',
  'cheetos-crunchy-325oz'
);

-- ---------- CANDY & CHOCOLATE ----------
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/004/000/001/2892/front_en.jpg' where slug = 'snickers-186oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/003/460/410/6040/front_en.jpg' where slug = 'kitkat-15oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/003/400/002/7555/front_en.jpg' where slug = 'reeses-cups-15oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/007/022/200/1738/front_en.jpg' where slug = 'sour-patch-kids-2oz';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/004/000/051/3005/front_en.jpg' where slug = 'haribo-goldbears-4oz';
update public.products set image_url = 'https://placehold.co/400x400/c9184a/ffffff?text=Candy' where slug in (
  'mms-peanut-174oz',
  'skittles-original-217oz'
);

-- ---------- COOKIES & SWEETS ----------
update public.products set image_url = 'https://placehold.co/400x400/c9184a/ffffff?text=Candy' where slug in (
  'oreo-original-3oz',
  'chips-ahoy-original-13oz',
  'nutella-go-18oz',
  'rice-krispies-treat-13oz'
);

-- ---------- COFFEE & TEA ----------
update public.products set image_url = 'https://placehold.co/400x400/3d1a00/ffffff?text=Coffee' where slug in (
  'turkish-coffee-100g',
  'arabic-coffee-cardamom-250g',
  'nescafe-classic-instant-35oz',
  'lipton-yellow-label-tea-100ct',
  'tazo-chai-spiced-black-tea-20ct'
);

-- ---------- MIDDLE EASTERN FAVORITES ----------
update public.products set image_url = 'https://placehold.co/400x400/1e4d2b/ffffff?text=ME+Specialty' where slug in (
  'zaatar-spice-mix-14oz',
  'medjool-dates-1lb',
  'tahini-sesame-paste-16oz',
  'chickpeas-canned-15oz',
  'fava-beans-canned-15oz',
  'halawa-sesame-candy-14oz',
  'pita-bread-6-pack',
  'rose-water-10oz'
);

-- ---------- HOUSEHOLD ESSENTIALS ----------
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/003/700/080/3366/front_en.jpg' where slug = 'bounty-paper-towels-2roll';
update public.products set image_url = 'https://images.openfoodfacts.org/images/products/003/700/037/1547/front_en.jpg' where slug = 'tide-laundry-pods-16ct';
update public.products set image_url = 'https://placehold.co/400x400/023e8a/ffffff?text=Household' where slug in (
  'charmin-ultra-soft-tp-6roll',
  'dawn-dish-soap-194oz',
  'energizer-aa-batteries-8pk',
  'usbc-charging-cable-6ft',
  'ziplock-gallon-bags-20ct'
);

-- ---------- PERSONAL CARE ----------
update public.products set image_url = 'https://placehold.co/400x400/023e8a/ffffff?text=Household' where slug in (
  'colgate-toothpaste-4oz',
  'dove-body-wash-22oz',
  'old-spice-deodorant-3oz',
  'bandaid-variety-pack-30ct'
);

-- ---------- BUNDLES ----------
update public.products set image_url = 'https://placehold.co/400x400/1a1f2e/e8600a?text=Bundle' where slug in (
  'movie-night-bundle',
  'gym-beast-bundle',
  'late-night-snack-pack',
  'arab-kitchen-starter-pack',
  'family-essentials-pack',
  'office-starter-refill',
  'healthy-snack-box',
  'ultimate-snack-bundle'
);
