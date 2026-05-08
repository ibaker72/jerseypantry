-- ============================================================
-- Migration 008: Seed product image_url placeholders
-- Uses placehold.co with brand-appropriate colors
-- ============================================================

-- DRINKS (light blue)
update public.products set image_url = 'https://placehold.co/400x400/DBEAFE/1E40AF.webp?text=💧'  where slug = 'poland-spring-water-169oz'   and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEE2E2/991B1B.webp?text=🥤'   where slug = 'coca-cola-20oz'               and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/EDE9FE/4C1D95.webp?text=🥤'   where slug = 'pepsi-20oz'                   and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/D1FAE5/065F46.webp?text=🟢'   where slug = 'sprite-20oz'                  and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF3C7/92400E.webp?text=🍵'   where slug = 'arizona-iced-tea-23oz'        and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FFF7ED/9A3412.webp?text=🍑'   where slug = 'snapple-peach-tea-16oz'       and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/E0F2FE/075985.webp?text=💧'   where slug = 'vitaminwater-xxx-20oz'        and image_url is null;

-- ENERGY & HYDRATION (yellow/orange)
update public.products set image_url = 'https://placehold.co/400x400/FEF9C3/713F12.webp?text=⚡'   where slug = 'red-bull-energy-84oz'         and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/F0FDF4/166534.webp?text=⚡'   where slug = 'celsius-energy-drink-12oz'    and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/D1FAE5/064E3B.webp?text=🐉'   where slug = 'monster-energy-green-16oz'   and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF08A/713F12.webp?text=🏃'   where slug = 'gatorade-cool-blue-20oz'     and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/DCFCE7/166534.webp?text=🏅'   where slug = 'bodyarmor-fruit-punch-16oz'  and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/EDE9FE/3730A3.webp?text=💧'   where slug = 'prime-hydration-blue-raspberry' and image_url is null;

-- CHIPS & SALTY SNACKS (amber)
update public.products set image_url = 'https://placehold.co/400x400/FEF3C7/92400E.webp?text=🌮'   where slug = 'doritos-nacho-cheese-275oz'  and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEE2E2/991B1B.webp?text=🌶️'  where slug = 'takis-fuego-99oz'             and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF9C3/78350F.webp?text=🥔'   where slug = 'lays-classic-2625oz'         and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEE2E2/7F1D1D.webp?text=🍟'   where slug = 'hot-fries-1oz'               and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FFF7ED/9A3412.webp?text=🧀'   where slug = 'cheetos-crunchy-325oz'       and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEE2E2/991B1B.webp?text=🔥'   where slug = 'flamin-hot-cheetos-325oz'    and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/E0F2FE/0C4A6E.webp?text=🥫'   where slug = 'pringles-original-52oz'      and image_url is null;

-- CANDY & CHOCOLATE (pink/purple)
update public.products set image_url = 'https://placehold.co/400x400/FEF3C7/92400E.webp?text=🍫'   where slug = 'snickers-186oz'              and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEE2E2/9F1239.webp?text=🍫'   where slug = 'kitkat-15oz'                 and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FCE7F3/9D174D.webp?text=🍬'   where slug = 'sour-patch-kids-2oz'         and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF9C3/92400E.webp?text=🐻'   where slug = 'haribo-goldbears-4oz'        and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FFF7ED/7C2D12.webp?text=🥜'   where slug = 'reeses-cups-15oz'            and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FCE7F3/86198F.webp?text=🌈'   where slug = 'mms-peanut-174oz'            and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FDF4FF/701A75.webp?text=🌈'   where slug = 'skittles-original-217oz'     and image_url is null;

-- COOKIES & SWEETS
update public.products set image_url = 'https://placehold.co/400x400/1C1917/F5F5F4.webp?text=🍪'   where slug = 'oreo-original-3oz'           and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF3C7/92400E.webp?text=🍪'   where slug = 'chips-ahoy-original-13oz'    and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF3C7/78350F.webp?text=🍫'   where slug = 'nutella-go-18oz'             and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF9C3/713F12.webp?text=🍘'   where slug = 'rice-krispies-treat-13oz'    and image_url is null;

-- COFFEE & TEA
update public.products set image_url = 'https://placehold.co/400x400/292524/F5F5F4.webp?text=☕'   where slug = 'turkish-coffee-100g'         and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/451A03/FEF3C7.webp?text=☕'   where slug = 'arabic-coffee-cardamom-250g' and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/1C1917/FEF3C7.webp?text=☕'   where slug = 'nescafe-classic-instant-35oz' and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF9C3/78350F.webp?text=🍵'   where slug = 'lipton-yellow-label-tea-100ct' and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FFF7ED/9A3412.webp?text=🫖'   where slug = 'tazo-chai-spiced-black-tea-20ct' and image_url is null;

-- MIDDLE EASTERN
update public.products set image_url = 'https://placehold.co/400x400/ECFDF5/064E3B.webp?text=🌿'   where slug = 'zaatar-spice-mix-14oz'       and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/78350F/FEF9C3.webp?text=🌴'   where slug = 'medjool-dates-1lb'           and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF9C3/78350F.webp?text=🌱'   where slug = 'tahini-sesame-paste-16oz'    and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF9C3/78350F.webp?text=🫘'   where slug = 'chickpeas-canned-15oz'       and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/DCFCE7/14532D.webp?text=🫘'   where slug = 'fava-beans-canned-15oz'      and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF3C7/92400E.webp?text=🍯'   where slug = 'halawa-sesame-candy-14oz'    and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF9C3/78350F.webp?text=🫓'   where slug = 'pita-bread-6-pack'           and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FCE7F3/9D174D.webp?text=🌹'   where slug = 'rose-water-10oz'             and image_url is null;

-- HOUSEHOLD ESSENTIALS
update public.products set image_url = 'https://placehold.co/400x400/EFF6FF/1D4ED8.webp?text=🏠'   where slug = 'bounty-paper-towels-2roll'   and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FFF7ED/9A3412.webp?text=🧻'   where slug = 'charmin-ultra-soft-tp-6roll' and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/EFF6FF/1E40AF.webp?text=🧼'   where slug = 'dawn-dish-soap-194oz'        and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/F0F9FF/0369A1.webp?text=🧺'   where slug = 'tide-laundry-pods-16ct'      and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEF9C3/78350F.webp?text=🔋'   where slug = 'energizer-aa-batteries-8pk'  and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/1C1917/F5F5F4.webp?text=🔌'   where slug = 'usbc-charging-cable-6ft'     and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/EFF6FF/1D4ED8.webp?text=🛍️'  where slug = 'ziplock-gallon-bags-20ct'    and image_url is null;

-- PERSONAL CARE
update public.products set image_url = 'https://placehold.co/400x400/F0F9FF/0369A1.webp?text=🦷'   where slug = 'colgate-toothpaste-4oz'      and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FCE7F3/9D174D.webp?text=🛁'   where slug = 'dove-body-wash-22oz'         and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/EFF6FF/1E40AF.webp?text=💪'   where slug = 'old-spice-deodorant-3oz'     and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/FEE2E2/991B1B.webp?text=🩹'   where slug = 'bandaid-variety-pack-30ct'   and image_url is null;

-- BUNDLES
update public.products set image_url = 'https://placehold.co/400x400/1C1917/FEF3C7.webp?text=🎬'   where slug = 'movie-night-bundle'          and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/166534/D1FAE5.webp?text=💪'   where slug = 'gym-beast-bundle'            and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/1C1917/FEE2E2.webp?text=🌙'   where slug = 'late-night-snack-pack'       and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/064E3B/D1FAE5.webp?text=🌿'   where slug = 'arab-kitchen-starter-pack'   and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/1E3A5F/DBEAFE.webp?text=🏠'   where slug = 'family-essentials-pack'      and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/1B4332/D1FAE5.webp?text=🏢'   where slug = 'office-starter-refill'       and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/DCFCE7/166534.webp?text=🥗'   where slug = 'healthy-snack-box'           and image_url is null;
update public.products set image_url = 'https://placehold.co/400x400/7F1D1D/FEE2E2.webp?text=🎁'   where slug = 'ultimate-snack-bundle'       and image_url is null;
