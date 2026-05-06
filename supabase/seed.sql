-- ============================================================
-- My Corner Store — Seed Data
-- ============================================================

-- Categories
insert into public.categories (name, slug, description, sort_order) values
  ('Drinks',                  'drinks',                  'Water, soda, juice, and more',                 1),
  ('Energy & Hydration',      'energy-hydration',        'Energy drinks and sports hydration',            2),
  ('Chips & Salty Snacks',    'chips-salty-snacks',      'Chips, pretzels, and salty favorites',          3),
  ('Candy & Chocolate',       'candy-chocolate',         'Sweet candy and chocolate treats',              4),
  ('Cookies & Sweets',        'cookies-sweets',          'Cookies, cakes, and sweet baked goods',         5),
  ('Coffee & Tea',            'coffee-tea',              'Coffee, tea, and hot beverages',                6),
  ('Middle Eastern Favorites','middle-eastern-favorites','Authentic Middle Eastern pantry staples',        7),
  ('Household Essentials',    'household-essentials',    'Paper goods, cleaning, and home basics',        8),
  ('Personal Care',           'personal-care',           'Toothpaste, body care, and hygiene essentials', 9),
  ('Bundles',                 'bundles',                 'Curated bundles at a great value',             10),
  ('Office Refill',           'office-refill',           'Bulk snacks and drinks for offices',           11),
  ('Local Delivery Deals',    'local-delivery-deals',    'Exclusive deals for local delivery',           12)
on conflict (slug) do nothing;

-- ============================================================
-- Products
-- ============================================================

-- DRINKS
insert into public.products (name, slug, sku, brand, size, category_id, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_active, is_featured)
select
  p.name, p.slug, p.sku, p.brand, p.size,
  c.id,
  p.retail_price, p.wholesale_cost, p.compare_at_price,
  p.inventory_quantity, p.reorder_threshold,
  p.description, p.badges::text[], p.shipping_eligible, p.delivery_eligible,
  true, p.is_featured
from (values
  ('Poland Spring Water 16.9oz', 'poland-spring-water-169oz', 'DRK-001', 'Poland Spring', '16.9 fl oz', 1.49, 0.65, null::numeric, 200, 30, 'Crisp natural spring water, perfect for on-the-go hydration.', '{"Delivery Eligible"}', true, true, true),
  ('Coca-Cola 20oz',             'coca-cola-20oz',           'DRK-002', 'Coca-Cola',    '20 fl oz',    2.29, 0.85, null::numeric, 150, 25, 'The classic Coca-Cola taste you know and love.',             '{"Best Seller","Delivery Eligible"}', true, true, true),
  ('Pepsi 20oz',                 'pepsi-20oz',               'DRK-003', 'Pepsi',        '20 fl oz',    2.29, 0.85, null::numeric, 120, 25, 'Bold, refreshing Pepsi cola.',                               '{"Delivery Eligible"}', true, true, false),
  ('Sprite 20oz',                'sprite-20oz',              'DRK-004', 'Sprite',       '20 fl oz',    2.29, 0.85, null::numeric, 100, 20, 'Light, crisp lemon-lime soda.',                              '{"Delivery Eligible"}', true, true, false),
  ('Arizona Iced Tea 23oz',      'arizona-iced-tea-23oz',    'DRK-005', 'Arizona',      '23 fl oz',    1.99, 0.70, null::numeric, 80,  15, 'Classic sweet iced tea at an unbeatable price.',             '{"Local Favorite","Delivery Eligible"}', true, true, false),
  ('Snapple Peach Tea 16oz',     'snapple-peach-tea-16oz',   'DRK-006', 'Snapple',      '16 fl oz',    2.49, 0.95, null::numeric, 60,  15, 'Real brewed peach tea made from the best stuff on Earth.',   '{"Delivery Eligible"}', true, true, false),
  ('Vitaminwater XXX 20oz',      'vitaminwater-xxx-20oz',    'DRK-007', 'Vitaminwater', '20 fl oz',    2.49, 0.95, null::numeric, 70,  15, 'Acai-blueberry-pomegranate enhanced water with vitamins.',   '{"Delivery Eligible"}', true, true, false)
) as p(name, slug, sku, brand, size, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_featured)
cross join lateral (select id from public.categories where slug = 'drinks') as c
on conflict (slug) do nothing;

-- ENERGY & HYDRATION
insert into public.products (name, slug, sku, brand, size, category_id, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_active, is_featured)
select
  p.name, p.slug, p.sku, p.brand, p.size,
  c.id,
  p.retail_price, p.wholesale_cost, p.compare_at_price,
  p.inventory_quantity, p.reorder_threshold,
  p.description, p.badges::text[], p.shipping_eligible, p.delivery_eligible,
  true, p.is_featured
from (values
  ('Red Bull Energy 8.4oz',     'red-bull-energy-84oz',    'ENR-001', 'Red Bull',  '8.4 fl oz', 3.49, 1.60, null::numeric, 120, 20, 'The original energy drink. Vitalizes body and mind.',             '{"Best Seller","Delivery Eligible"}', true, true, true),
  ('Celsius Energy Drink 12oz', 'celsius-energy-drink-12oz','ENR-002', 'Celsius',   '12 fl oz',  2.99, 1.20, null::numeric, 100, 20, 'Live fit with essential energy and zero sugar.',                  '{"New","Delivery Eligible"}', true, true, true),
  ('Monster Energy Green 16oz', 'monster-energy-green-16oz','ENR-003', 'Monster',   '16 fl oz',  3.49, 1.50, null::numeric, 90,  15, 'Unleash the beast. Monster Original green.',                      '{"Best Seller","Delivery Eligible"}', true, true, false),
  ('Gatorade Cool Blue 20oz',   'gatorade-cool-blue-20oz', 'ENR-004', 'Gatorade',  '20 fl oz',  2.49, 0.95, null::numeric, 110, 20, 'Electrolyte-fueled sports drink for peak hydration.',             '{"Best Seller","Delivery Eligible"}', true, true, true),
  ('BodyArmor Fruit Punch 16oz','bodyarmor-fruit-punch-16oz','ENR-005','BodyArmor', '16 fl oz',  2.49, 0.95, null::numeric, 80,  15, 'Coconut water-based sports drink packed with vitamins.',          '{"New","Delivery Eligible"}', true, true, false),
  ('Prime Hydration Blue Raspberry','prime-hydration-blue-raspberry','ENR-006','Prime','16.9 fl oz',2.99,1.10, null::numeric, 60, 10, 'KSI & Logan Paul co-founded sports hydration drink.',             '{"New","Local Favorite"}', true, true, false)
) as p(name, slug, sku, brand, size, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_featured)
cross join lateral (select id from public.categories where slug = 'energy-hydration') as c
on conflict (slug) do nothing;

-- CHIPS & SALTY SNACKS
insert into public.products (name, slug, sku, brand, size, category_id, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_active, is_featured)
select
  p.name, p.slug, p.sku, p.brand, p.size,
  c.id,
  p.retail_price, p.wholesale_cost, p.compare_at_price,
  p.inventory_quantity, p.reorder_threshold,
  p.description, p.badges::text[], p.shipping_eligible, p.delivery_eligible,
  true, p.is_featured
from (values
  ('Doritos Nacho Cheese 2.75oz', 'doritos-nacho-cheese-275oz', 'SNK-001', 'Doritos', '2.75 oz', 2.49, 0.90, null::numeric, 150, 25, 'Boldly seasoned nacho cheese tortilla chips.',          '{"Best Seller","Delivery Eligible"}', true, true, true),
  ('Takis Fuego 9.9oz',           'takis-fuego-99oz',          'SNK-002', 'Takis',   '9.9 oz',  4.99, 2.10, null::numeric, 100, 20, 'Rolled tortilla chips in HOT chili pepper & lime.',     '{"Best Seller","Local Favorite","Delivery Eligible"}', true, true, true),
  ('Lay''s Classic 2.625oz',      'lays-classic-2625oz',       'SNK-003', 'Lay''s',  '2.625 oz',2.49, 0.90, null::numeric, 140, 25, 'America''s favorite potato chip. Light, crispy, classic.',  '{"Best Seller","Delivery Eligible"}', true, true, false),
  ('Hot Fries 1oz',               'hot-fries-1oz',             'SNK-004', 'Andy Capp''s','1 oz', 1.49, 0.45, null::numeric, 80,  15, 'Crunchy fries with a bold hot flavor.',                 '{"Local Favorite","Delivery Eligible"}', true, true, false),
  ('Cheetos Crunchy 3.25oz',      'cheetos-crunchy-325oz',     'SNK-005', 'Cheetos', '3.25 oz', 2.49, 0.90, null::numeric, 120, 20, 'The dangerously cheesy snack you love.',                '{"Best Seller","Delivery Eligible"}', true, true, false),
  ('Flamin'' Hot Cheetos 3.25oz', 'flamin-hot-cheetos-325oz',  'SNK-006', 'Cheetos', '3.25 oz', 2.49, 0.90, null::numeric, 110, 20, 'The iconic Flamin'' Hot heat, now a cultural icon.',    '{"Best Seller","Local Favorite","Delivery Eligible"}', true, true, true),
  ('Pringles Original 5.2oz',     'pringles-original-52oz',    'SNK-007', 'Pringles','5.2 oz',  3.49, 1.40, null::numeric, 90,  15, 'Once you pop, you can''t stop. Original flavor.',        '{"Delivery Eligible"}', true, true, false)
) as p(name, slug, sku, brand, size, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_featured)
cross join lateral (select id from public.categories where slug = 'chips-salty-snacks') as c
on conflict (slug) do nothing;

-- CANDY & CHOCOLATE
insert into public.products (name, slug, sku, brand, size, category_id, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_active, is_featured)
select
  p.name, p.slug, p.sku, p.brand, p.size,
  c.id,
  p.retail_price, p.wholesale_cost, p.compare_at_price,
  p.inventory_quantity, p.reorder_threshold,
  p.description, p.badges::text[], p.shipping_eligible, p.delivery_eligible,
  true, p.is_featured
from (values
  ('Snickers 1.86oz',        'snickers-186oz',        'CND-001', 'Snickers',   '1.86 oz', 2.29, 0.85, null::numeric, 180, 30, 'Satisfying chocolate, caramel, peanuts & nougat.',     '{"Best Seller","Delivery Eligible"}', true, true, true),
  ('KitKat 1.5oz',           'kitkat-15oz',           'CND-002', 'KitKat',     '1.5 oz',  2.29, 0.85, null::numeric, 160, 25, 'Break me off a piece of that Kit Kat bar.',            '{"Best Seller","Delivery Eligible"}', true, true, false),
  ('Sour Patch Kids 2oz',    'sour-patch-kids-2oz',   'CND-003', 'Sour Patch', '2 oz',    2.49, 0.90, null::numeric, 140, 25, 'First sour, then sweet. Soft and chewy candy.',        '{"Best Seller","Delivery Eligible"}', true, true, true),
  ('Haribo Goldbears 4oz',   'haribo-goldbears-4oz',  'CND-004', 'Haribo',     '4 oz',    3.49, 1.30, null::numeric, 100, 20, 'The original gummy bear. Made with real fruit juice.', '{"Local Favorite","Delivery Eligible"}', true, true, false),
  ('Reese''s Cups 1.5oz',    'reeses-cups-15oz',      'CND-005', 'Reese''s',   '1.5 oz',  2.29, 0.85, null::numeric, 150, 25, 'Perfect combination of chocolate and peanut butter.',  '{"Best Seller","Delivery Eligible"}', true, true, false),
  ('M&Ms Peanut 1.74oz',     'mms-peanut-174oz',      'CND-006', 'M&M''s',     '1.74 oz', 2.29, 0.85, null::numeric, 130, 25, 'Milk chocolate over whole peanuts. Melts in your mouth.','{"Best Seller","Delivery Eligible"}', true, true, false),
  ('Skittles Original 2.17oz','skittles-original-217oz','CND-007','Skittles',  '2.17 oz', 2.29, 0.85, null::numeric, 120, 20, 'Taste the rainbow. Original fruit flavors.',           '{"Delivery Eligible"}', true, true, false)
) as p(name, slug, sku, brand, size, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_featured)
cross join lateral (select id from public.categories where slug = 'candy-chocolate') as c
on conflict (slug) do nothing;

-- COOKIES & SWEETS
insert into public.products (name, slug, sku, brand, size, category_id, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_active, is_featured)
select
  p.name, p.slug, p.sku, p.brand, p.size,
  c.id,
  p.retail_price, p.wholesale_cost, p.compare_at_price,
  p.inventory_quantity, p.reorder_threshold,
  p.description, p.badges::text[], p.shipping_eligible, p.delivery_eligible,
  true, p.is_featured
from (values
  ('Oreo Original 3oz',         'oreo-original-3oz',       'CKE-001', 'Oreo',      '3 oz',    2.99, 1.10, null::numeric, 160, 25, 'Milk''s favorite cookie. Chocolate wafers with cream filling.', '{"Best Seller","Delivery Eligible"}', true, true, true),
  ('Chips Ahoy Original 13oz',  'chips-ahoy-original-13oz','CKE-002', 'Chips Ahoy','13 oz',   5.49, 2.20, null::numeric, 80,  15, 'Classic real chocolate chip cookies baked to perfection.',    '{"Best Seller","Delivery Eligible"}', true, true, false),
  ('Nutella & Go 1.8oz',        'nutella-go-18oz',         'CKE-003', 'Nutella',   '1.8 oz',  3.49, 1.50, null::numeric, 70,  15, 'Hazelnut cocoa spread with crispy breadsticks.',              '{"Local Favorite","Delivery Eligible"}', true, true, false),
  ('Rice Krispies Treat 1.3oz', 'rice-krispies-treat-13oz','CKE-004', 'Kellogg''s','1.3 oz',  1.99, 0.70, null::numeric, 90,  20, 'Classic marshmallow snap crackle pop bars.',                  '{"Delivery Eligible"}', true, true, false)
) as p(name, slug, sku, brand, size, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_featured)
cross join lateral (select id from public.categories where slug = 'cookies-sweets') as c
on conflict (slug) do nothing;

-- COFFEE & TEA
insert into public.products (name, slug, sku, brand, size, category_id, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_active, is_featured)
select
  p.name, p.slug, p.sku, p.brand, p.size,
  c.id,
  p.retail_price, p.wholesale_cost, p.compare_at_price,
  p.inventory_quantity, p.reorder_threshold,
  p.description, p.badges::text[], p.shipping_eligible, p.delivery_eligible,
  true, p.is_featured
from (values
  ('Turkish Coffee 100g',               'turkish-coffee-100g',             'COF-001', 'Kurukahveci Mehmet Efendi','100g', 7.99, 3.50, null::numeric, 60, 10, 'Finely ground Turkish coffee. Rich, bold, and aromatic.',     '{"Local Favorite","Middle Eastern"}', true, true, true),
  ('Arabic Coffee with Cardamom 250g',  'arabic-coffee-cardamom-250g',     'COF-002', 'Al Rifai',                '250g', 9.99, 4.50, null::numeric, 50, 10, 'Traditional Arabic coffee blend with authentic cardamom.',    '{"Local Favorite","Middle Eastern","Delivery Eligible"}', true, true, true),
  ('Nescafe Classic Instant 3.5oz',     'nescafe-classic-instant-35oz',    'COF-003', 'Nescafe',                 '3.5 oz',6.99, 2.80, null::numeric, 70, 15, 'Rich, full-bodied instant coffee. Ready in seconds.',         '{"Delivery Eligible"}', true, true, false),
  ('Lipton Yellow Label Tea 100ct',     'lipton-yellow-label-tea-100ct',   'COF-004', 'Lipton',                  '100 ct',5.99, 2.20, null::numeric, 80, 15, 'Bright, golden, brisk black tea. The world''s favorite.',     '{"Best Seller","Delivery Eligible"}', true, true, false),
  ('Tazo Chai Spiced Black Tea 20ct',   'tazo-chai-spiced-black-tea-20ct', 'COF-005', 'Tazo',                    '20 ct', 5.49, 2.10, null::numeric, 50, 10, 'Warm spices and bold black tea in every sip.',                '{"Delivery Eligible"}', true, true, false)
) as p(name, slug, sku, brand, size, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_featured)
cross join lateral (select id from public.categories where slug = 'coffee-tea') as c
on conflict (slug) do nothing;

-- MIDDLE EASTERN FAVORITES
insert into public.products (name, slug, sku, brand, size, category_id, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_active, is_featured)
select
  p.name, p.slug, p.sku, p.brand, p.size,
  c.id,
  p.retail_price, p.wholesale_cost, p.compare_at_price,
  p.inventory_quantity, p.reorder_threshold,
  p.description, p.badges::text[], p.shipping_eligible, p.delivery_eligible,
  true, p.is_featured
from (values
  ('Zaatar Spice Mix 14oz',       'zaatar-spice-mix-14oz',      'MDE-001', 'Ziyad',   '14 oz', 6.99, 2.80, null::numeric, 70, 10, 'Authentic Palestinian zaatar blend with thyme, sumac, and sesame.', '{"Local Favorite","Middle Eastern","Delivery Eligible"}', true, true, true),
  ('Medjool Dates 1lb',           'medjool-dates-1lb',          'MDE-002', 'Bard''s', '1 lb',  12.99,5.50, null::numeric, 40, 8,  'Premium California Medjool dates. Soft, sweet, and caramel-like.',  '{"Local Favorite","Middle Eastern","Best Seller","Delivery Eligible"}', true, true, true),
  ('Tahini Sesame Paste 16oz',    'tahini-sesame-paste-16oz',   'MDE-003', 'Soom',    '16 oz', 9.99, 4.20, null::numeric, 50, 10, 'Pure stone-ground sesame tahini. Perfect for hummus or dressing.',  '{"Local Favorite","Middle Eastern","Delivery Eligible"}', true, true, true),
  ('Chickpeas Canned 15oz',       'chickpeas-canned-15oz',      'MDE-004', 'Goya',    '15 oz', 1.99, 0.70, null::numeric, 100,20, 'Tender garbanzo beans ready for hummus, salads, and stews.',        '{"Delivery Eligible"}', true, true, false),
  ('Fava Beans Canned 15oz',      'fava-beans-canned-15oz',     'MDE-005', 'Ziyad',   '15 oz', 2.49, 0.90, null::numeric, 80, 15, 'Ready-to-eat fava beans for ful medames and more.',                 '{"Local Favorite","Middle Eastern","Delivery Eligible"}', true, true, false),
  ('Halawa Sesame Candy 14oz',    'halawa-sesame-candy-14oz',   'MDE-006', 'Joyva',   '14 oz', 6.99, 2.80, null::numeric, 45, 8,  'Traditional sesame halvah. Soft, crumbly, and subtly sweet.',       '{"Local Favorite","Middle Eastern","Delivery Eligible"}', true, true, true),
  ('Pita Bread 6-pack',           'pita-bread-6-pack',          'MDE-007', 'Joseph''s','6 ct', 3.99, 1.50, null::numeric, 60, 12, 'Soft, fresh-baked pita bread. Perfect for dips or wraps.',          '{"Local Favorite","Delivery Eligible"}', false, true, false),
  ('Rose Water 10oz',             'rose-water-10oz',            'MDE-008', 'Cortas',  '10 oz', 4.99, 2.00, null::numeric, 40, 8,  'Pure rose water for baking, drinks, and skincare.',                 '{"Middle Eastern","Delivery Eligible"}', true, true, false)
) as p(name, slug, sku, brand, size, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_featured)
cross join lateral (select id from public.categories where slug = 'middle-eastern-favorites') as c
on conflict (slug) do nothing;

-- HOUSEHOLD ESSENTIALS
insert into public.products (name, slug, sku, brand, size, category_id, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_active, is_featured)
select
  p.name, p.slug, p.sku, p.brand, p.size,
  c.id,
  p.retail_price, p.wholesale_cost, p.compare_at_price,
  p.inventory_quantity, p.reorder_threshold,
  p.description, p.badges::text[], p.shipping_eligible, p.delivery_eligible,
  true, p.is_featured
from (values
  ('Bounty Paper Towels 2-Roll',   'bounty-paper-towels-2roll',  'HHE-001', 'Bounty',    '2 rolls', 5.99, 2.50, null::numeric, 60, 10, 'The quicker picker upper. 2X more absorbent.',             '{"Best Seller","Delivery Eligible","Shipping Eligible"}', true, true, false),
  ('Charmin Ultra Soft TP 6-Roll', 'charmin-ultra-soft-tp-6roll','HHE-002', 'Charmin',   '6 rolls', 8.99, 3.80, null::numeric, 50, 10, 'Soft, strong bathroom tissue. Trusted by families.',       '{"Best Seller","Delivery Eligible","Shipping Eligible"}', true, true, false),
  ('Dawn Dish Soap 19.4oz',        'dawn-dish-soap-194oz',       'HHE-003', 'Dawn',      '19.4 oz', 4.99, 2.00, null::numeric, 70, 15, 'Cuts through grease faster. Trusted dish soap.',           '{"Best Seller","Delivery Eligible"}', true, true, false),
  ('Tide Laundry Pods 16ct',       'tide-laundry-pods-16ct',     'HHE-004', 'Tide',      '16 ct',   12.99,5.50, null::numeric, 45, 8,  'Clean, fresh laundry every time with convenient pods.',     '{"Best Seller","Delivery Eligible","Shipping Eligible"}', true, true, false),
  ('Energizer AA Batteries 8-Pack','energizer-aa-batteries-8pk', 'HHE-005', 'Energizer', '8 pack',  9.99, 4.00, null::numeric, 55, 10, 'Long-lasting power for your devices.',                     '{"Delivery Eligible","Shipping Eligible"}', true, true, false),
  ('USB-C Charging Cable 6ft',     'usbc-charging-cable-6ft',    'HHE-006', 'Anker',     '6 ft',    11.99,4.50, null::numeric, 40, 8,  'Durable braided USB-C cable. Fast charging compatible.',   '{"Delivery Eligible","Shipping Eligible"}', true, true, false),
  ('Ziplock Gallon Bags 20ct',     'ziplock-gallon-bags-20ct',   'HHE-007', 'Ziploc',    '20 ct',   5.99, 2.20, null::numeric, 65, 12, 'Double zip seal keeps food fresh longer.',                 '{"Delivery Eligible","Shipping Eligible"}', true, true, false)
) as p(name, slug, sku, brand, size, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_featured)
cross join lateral (select id from public.categories where slug = 'household-essentials') as c
on conflict (slug) do nothing;

-- PERSONAL CARE
insert into public.products (name, slug, sku, brand, size, category_id, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_active, is_featured)
select
  p.name, p.slug, p.sku, p.brand, p.size,
  c.id,
  p.retail_price, p.wholesale_cost, p.compare_at_price,
  p.inventory_quantity, p.reorder_threshold,
  p.description, p.badges::text[], p.shipping_eligible, p.delivery_eligible,
  true, p.is_featured
from (values
  ('Colgate Toothpaste 4oz',        'colgate-toothpaste-4oz',      'PRC-001', 'Colgate',  '4 oz',    3.99, 1.60, null::numeric, 80, 15, 'Cavity protection and fresh breath toothpaste.',         '{"Best Seller","Delivery Eligible","Shipping Eligible"}', true, true, false),
  ('Dove Body Wash 22oz',           'dove-body-wash-22oz',         'PRC-002', 'Dove',     '22 oz',   7.99, 3.20, null::numeric, 55, 10, 'Moisturizing body wash with ¼ moisturizing cream.',      '{"Delivery Eligible","Shipping Eligible"}', true, true, false),
  ('Old Spice Deodorant 3oz',       'old-spice-deodorant-3oz',     'PRC-003', 'Old Spice','3 oz',    4.99, 2.00, null::numeric, 60, 12, 'Original scent antiperspirant deodorant.',               '{"Delivery Eligible","Shipping Eligible"}', true, true, false),
  ('Band-Aid Variety Pack 30ct',    'bandaid-variety-pack-30ct',   'PRC-004', 'Band-Aid', '30 ct',   6.99, 2.80, null::numeric, 50, 10, 'Flexible fabric bandages for everyday cuts and scrapes.', '{"Delivery Eligible","Shipping Eligible"}', true, true, false)
) as p(name, slug, sku, brand, size, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_featured)
cross join lateral (select id from public.categories where slug = 'personal-care') as c
on conflict (slug) do nothing;

-- ============================================================
-- BUNDLES
-- ============================================================
insert into public.products (name, slug, sku, brand, size, category_id, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_active, is_featured, is_bundle)
select
  p.name, p.slug, p.sku, p.brand, p.size,
  c.id,
  p.retail_price, p.wholesale_cost, p.compare_at_price,
  p.inventory_quantity, p.reorder_threshold,
  p.description, p.badges::text[], p.shipping_eligible, p.delivery_eligible,
  true, p.is_featured, true
from (values
  ('Movie Night Bundle',           'movie-night-bundle',           'BND-001', 'My Corner Store', 'Bundle', 18.99, 7.50, 22.99, 30, 5,
   'Everything for the perfect movie night: Popcorn, Sour Patch Kids, Oreos, Doritos, and a Coke.',
   '{"Bundle","Best Seller","Delivery Eligible"}', true, true, true),
  ('Gym Beast Bundle',             'gym-beast-bundle',             'BND-002', 'My Corner Store', 'Bundle', 14.99, 6.00, 18.99, 25, 5,
   'Fuel your workout: Celsius Energy Drink, Gatorade, BodyArmor, and Haribo Goldbears.',
   '{"Bundle","Delivery Eligible"}', true, true, true),
  ('Late Night Snack Pack',        'late-night-snack-pack',        'BND-003', 'My Corner Store', 'Bundle', 16.99, 6.50, 20.99, 25, 5,
   'Perfect for late nights: Takis Fuego, Flamin'' Hot Cheetos, Sour Patch Kids, and Red Bull.',
   '{"Bundle","Local Favorite","Delivery Eligible"}', true, true, true),
  ('Arab Kitchen Starter Pack',    'arab-kitchen-starter-pack',    'BND-004', 'My Corner Store', 'Bundle', 29.99,12.00, 36.99, 20, 5,
   'Stock your pantry: Zaatar, Tahini, Medjool Dates, Turkish Coffee, and Fava Beans.',
   '{"Bundle","Local Favorite","Middle Eastern","Delivery Eligible"}', true, true, true),
  ('Family Essentials Pack',       'family-essentials-pack',       'BND-005', 'My Corner Store', 'Bundle', 34.99,14.00, 42.99, 15, 3,
   'Home must-haves: Bounty Paper Towels, Charmin TP, Tide Pods, Dawn Dish Soap, and Ziplock Bags.',
   '{"Bundle","Delivery Eligible","Shipping Eligible"}', true, true, false),
  ('Office Starter Refill',        'office-starter-refill',        'BND-006', 'My Corner Store', 'Bundle', 49.99,20.00, 59.99, 15, 3,
   'Keep the office stocked: Mixed drinks, chips, candy, and coffee for a week of snacking.',
   '{"Bundle","Office Refill","Delivery Eligible"}', true, true, true),
  ('Healthy Snack Box',            'healthy-snack-box',            'BND-007', 'My Corner Store', 'Bundle', 22.99, 9.00, 27.99, 20, 5,
   'Better-for-you picks: BodyArmor, Celsius, Vitaminwater, Chickpeas, and Haribo.',
   '{"Bundle","New","Delivery Eligible"}', true, true, false),
  ('Ultimate Snack Bundle',        'ultimate-snack-bundle',        'BND-008', 'My Corner Store', 'Bundle', 39.99,15.00, 49.99, 20, 5,
   'The works: Chips, candy, cookies, drinks, and energy — a full snack haul in one box.',
   '{"Bundle","Best Seller","Delivery Eligible"}', true, true, true)
) as p(name, slug, sku, brand, size, retail_price, wholesale_cost, compare_at_price, inventory_quantity, reorder_threshold, description, badges, shipping_eligible, delivery_eligible, is_featured)
cross join lateral (select id from public.categories where slug = 'bundles') as c
on conflict (slug) do nothing;

-- ============================================================
-- Delivery Zones — North Jersey
-- ============================================================
insert into public.delivery_zones (name, postal_code, city, delivery_fee, free_delivery_minimum, is_active) values
  ('Paterson Central',    '07501', 'Paterson',        4.99, 50.00, true),
  ('Paterson East',       '07502', 'Paterson',        4.99, 50.00, true),
  ('Paterson West',       '07503', 'Paterson',        4.99, 50.00, true),
  ('Paterson South',      '07504', 'Paterson',        4.99, 50.00, true),
  ('Paterson North',      '07505', 'Paterson',        4.99, 50.00, true),
  ('Clifton',             '07011', 'Clifton',         4.99, 50.00, true),
  ('Clifton East',        '07012', 'Clifton',         4.99, 50.00, true),
  ('Clifton Heights',     '07013', 'Clifton',         4.99, 50.00, true),
  ('Clifton West',        '07014', 'Clifton',         4.99, 50.00, true),
  ('Totowa',              '07512', 'Totowa',          4.99, 50.00, true),
  ('Woodland Park',       '07424', 'Woodland Park',   4.99, 50.00, true),
  ('Haledon',             '07508', 'Haledon',         4.99, 50.00, true),
  ('Prospect Park',       '07508', 'Prospect Park',   4.99, 50.00, true),
  ('Wayne',               '07470', 'Wayne',           5.99, 50.00, true),
  ('Wayne East',          '07474', 'Wayne',           5.99, 50.00, true),
  ('Passaic',             '07055', 'Passaic',         4.99, 50.00, true)
on conflict do nothing;

-- ============================================================
-- Coupon
-- ============================================================
insert into public.coupons (code, type, value, minimum_subtotal, is_active) values
  ('CORNER10', 'percent', 10.00, 0.00, true)
on conflict (code) do nothing;
