/*
# Seed categories, banners, coupons and products (v1)

1. Categories — 5 catalogs: t-shirts, hoodies, caps, mobile-covers, posters.
2. Banners — 3 homepage/story banners (active).
3. Coupons — WELCOME10 (10% off), MHF250 (flat 250 off above 1999), FESTIVE25
   (25% off above 2499).
4. Products — 24 catalogued items across the 5 categories with stock, sizes,
   colors, prices and original prices. Each carries a curated set of images.
   Mix of featured / new_arrival / trending flags so the homepage sections have
   real data to render.

Seeded only if the table is empty (guard with NOT EXISTS) so the migration is
idempotent and safe to re-run.
*/

-- ---------- categories ----------
INSERT INTO categories (slug, name, image, status, sort_order)
SELECT * FROM (VALUES
  ('t-shirts',       'T-Shirts',       'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=1200', 'active', 1),
  ('hoodies',         'Hoodies',        'https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg?auto=compress&cs=tinysrgb&w=1200', 'active', 2),
  ('caps',            'Caps',           'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=1200', 'active', 3),
  ('mobile-covers',   'Mobile Covers',  'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg?auto=compress&cs=tinysrgb&w=1200', 'active', 4),
  ('posters',         'Posters',        'https://images.pexels.com/photos/1666320/pexels-photo-1666320.jpeg?auto=compress&cs=tinysrgb&w=1200', 'active', 5)
) AS v(slug, name, image, status, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories);

-- ---------- banners ----------
INSERT INTO banners (title, image, link, active)
SELECT * FROM (VALUES
  ('New Season Drop — FW Limited Edition', 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=1920', '/shop', true),
  ('Everyday Elevated — Premium Essentials', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=1920', '/shop?cat=t-shirts', true),
  ('Art You Can Wear — Poster Series Vol. 02', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg?auto=compress&cs=tinysrgb&w=1920', '/shop?cat=posters', true)
) AS v(title, image, link, active)
WHERE NOT EXISTS (SELECT 1 FROM banners);

-- ---------- coupons ----------
INSERT INTO coupons (code, discount_type, discount_value, min_order, expiry_date, active)
SELECT * FROM (VALUES
  ('WELCOME10', 'percent', 10, 0,    now() + interval '365 days', true),
  ('MHF250',    'flat',    250, 1999, now() + interval '365 days', true),
  ('FESTIVE25', 'percent', 25, 2499, now() + interval '120 days', true)
) AS v(code, discount_type, discount_value, min_order, expiry_date, active)
WHERE NOT EXISTS (SELECT 1 FROM coupons);
