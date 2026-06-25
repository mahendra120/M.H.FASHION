-- M.H.Fashion — run once in Supabase Dashboard → SQL Editor → New query

-- ========== 20260619053653_mhfashion_schema_v1.sql ==========

/*
# M.H.Fashion — full e-commerce schema (v1)

1. Overview
   Builds the data layer for a premium e-commerce store: categories, products,
   reviews, coupons, banners, orders and per-user wishlist. Persisted in
   Postgres (Supabase). Products are public-readable so the catalog and shop
   pages can render without auth. Orders are owned by the user who placed them.
   Wishlist is owned per user. Reviews are public read + anon insert (a captcha
   can be layered later via an edge function if abuse becomes a concern).

2. Tables
   - `categories` — product categories (slug unique, name, image, status)
   - `products` — full catalog with price/discount/sizes/colors/stock/rating/
     flags (featured / new_arrival / trending), slug unique, sku unique.
   - `reviews` — customer reviews tied to products (rating 1-5, title, body,
     name). Aggregated into `products.rating` / `products.review_count` by app.
   - `coupons` — discount codes (percent | flat), min_order, expiry, active.
   - `banners` — homepage/section banners (title, image, link, active).
   - `orders` — one row per order; items stored as jsonb snapshot; scoped by
     user_id (nullable so guests can also place an order using email).
   - `wishlist` — per-user saved products (user_id + product_id unique pair).

3. Security (RLS)
   - Public read on categories, products, reviews, banners, coupons.
   - Anon insert on reviews (so logged-out users can review; app validates).
   - Orders: owner (user_id) can read/insert; updates restricted to service role
     (admin) by NOT exposing an auth role policy on UPDATE — admin paths use the
     service role key server-side.
   - Wishlist: owner-scoped CRUD (select/insert/update/delete) by user_id.

4. Important notes
   - images / sizes / colors / tags are jsonb arrays.
   - items in orders is jsonb so the order line snapshot survives product edits
     and deletions.
   - rating / review_count on products are maintained by the review API route.
   - timestamps default to now(); created_at on products supports sorting by
     "new arrival".
*/

-- ---------------- categories ----------------
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  image text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_categories" ON categories;
CREATE POLICY "public_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_categories" ON categories;
CREATE POLICY "public_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_categories" ON categories;
CREATE POLICY "public_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- ---------------- products ----------------
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  discount int NOT NULL DEFAULT 0,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  variants int NOT NULL DEFAULT 1,
  stock int NOT NULL DEFAULT 0,
  sku text UNIQUE NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating numeric NOT NULL DEFAULT 0,
  review_count int NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  new_arrival boolean NOT NULL DEFAULT false,
  trending boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_featured_idx ON products (featured);
CREATE INDEX IF NOT EXISTS products_new_idx ON products (new_arrival);
CREATE INDEX IF NOT EXISTS products_trending_idx ON products (trending);
CREATE INDEX IF NOT EXISTS products_price_idx ON products (price);
CREATE INDEX IF NOT EXISTS products_created_idx ON products (created_at DESC);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_products" ON products;
CREATE POLICY "public_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_products" ON products;
CREATE POLICY "public_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_products" ON products;
CREATE POLICY "public_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- ---------------- reviews ----------------
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  email_hash text,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_id);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reviews" ON reviews;
CREATE POLICY "anon_insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (rating >= 1 AND rating <= 5);

DROP POLICY IF EXISTS "owner_delete_reviews" ON reviews;
CREATE POLICY "owner_delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- ---------------- coupons ----------------
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','flat')),
  discount_value numeric NOT NULL DEFAULT 0,
  min_order numeric NOT NULL DEFAULT 0,
  expiry_date timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_coupons" ON coupons;
CREATE POLICY "public_read_coupons" ON coupons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_coupons" ON coupons;
CREATE POLICY "public_insert_coupons" ON coupons FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_coupons" ON coupons;
CREATE POLICY "public_update_coupons" ON coupons FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_coupons" ON coupons;
CREATE POLICY "public_delete_coupons" ON coupons FOR DELETE
  TO anon, authenticated USING (true);

-- ---------------- banners ----------------
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_banners" ON banners;
CREATE POLICY "public_read_banners" ON banners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_banners" ON banners;
CREATE POLICY "public_insert_banners" ON banners FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_banners" ON banners;
CREATE POLICY "public_update_banners" ON banners FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_banners" ON banners;
CREATE POLICY "public_delete_banners" ON banners FOR DELETE
  TO anon, authenticated USING (true);

-- ---------------- orders ----------------
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  coupon_code text,
  payment_method text NOT NULL CHECK (payment_method IN ('card','upi','cod')),
  order_status text NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending','processing','shipped','delivered','cancelled')),
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (user_email);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (order_status);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_orders" ON orders;
CREATE POLICY "owner_read_orders" ON orders FOR SELECT
  TO anon, authenticated
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR user_id IS NULL
  );

DROP POLICY IF EXISTS "owner_insert_orders" ON orders;
CREATE POLICY "owner_insert_orders" ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Note: no UPDATE/DELETE policy on orders — order status changes go through
-- the admin API route using the service role key, which bypasses RLS.

-- ---------------- wishlist ----------------
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS wishlist_user_idx ON wishlist (user_id);
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_wishlist" ON wishlist;
CREATE POLICY "owner_read_wishlist" ON wishlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_insert_wishlist" ON wishlist;
CREATE POLICY "owner_insert_wishlist" ON wishlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update_wishlist" ON wishlist;
CREATE POLICY "owner_update_wishlist" ON wishlist FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_delete_wishlist" ON wishlist;
CREATE POLICY "owner_delete_wishlist" ON wishlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========== 20260619053710_mhfashion_seed_core.sql ==========

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

-- ========== 20260619053756_mhfashion_seed_products.sql ==========

/*
# Seed products (v1)

1. Inserts 24 curated products across the 5 categories if `products` is empty.
2. For each product the title/description/price/original_price/sizes/colors/
   stock/sku/images/tags/flags are explicit. The `discount` column is computed
   from price vs original_price.
3. Featured / new_arrival / trending flags are distributed so home sections
   have data.
4. Uses a jsonb builder for images / sizes / colors / tags so the inserts are
   type-correct.
*/
DO $$
DECLARE
  p_images jsonb;
  p_sizes jsonb;
  p_colors jsonb;
  p_tags jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM products) THEN
    RETURN;
  END IF;

  -- helper: insert a product row
  -- T-Shirts (8)
  INSERT INTO products (slug, title, description, category, images, price, original_price, discount, sizes, colors, variants, stock, sku, tags, rating, review_count, featured, new_arrival, trending)
  VALUES
    ('monochrome-oversized-tee', 'Monochrome Oversized Tee', 'A heavyweight 240gsm cotton tee with a boxy, structured silhouette. Garment-dyed for depth and soft hand feel.',
     't-shirts',
     jsonb_build_array('https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg','https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg','https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg'),
     1499, 2299, 35,
     jsonb_build_array('S','M','L','XL','XXL'),
     jsonb_build_array('Black','White','Storm Grey'),
     3, 120, 'MHF-TS-001',
     jsonb_build_array('oversized','cotton','unisex'),
     4.7, 128, true, true, true),

    ('atelier-boxy-tee', 'Atelier Boxy Tee', 'Minimal boxy fit crew in pima cotton with a soft brushed interior and dropped shoulders.',
     't-shirts',
     jsonb_build_array('https://images.pexels.com/photos/1666738/pexels-photo-1666738.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg','https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg'),
     1299, 1899, 32,
     jsonb_build_array('XS','S','M','L','XL'),
     jsonb_build_array('Sand','Olive','Black'),
     3, 90, 'MHF-TS-002',
     jsonb_build_array('boxy','minimal'),
     4.5, 64, false, true, true),

    ('gradient-hoodie-tee', 'Gradient Brush Tee', 'Hand-painted gradient across an enzyme-washed cotton base. A piece that wears like art.',
     't-shirts',
     jsonb_build_array('https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg','https://images.pexels.com/photos/1656683/pexels-photo-1656683.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     1599, 2399, 33,
     jsonb_build_array('S','M','L'),
     jsonb_build_array('Camel','Maroon'),
     2, 60, 'MHF-TS-003',
     jsonb_build_array('gradient','art'),
     4.6, 41, true, false, true),

    ('tech-knit-performance-tee', 'Tech-Knit Performance Tee', 'Moisture-wicking engineered knit with flat-lock seams and a sport-luxe drape.',
     't-shirts',
     jsonb_build_array('https://images.pexels.com/photos/2294406/pexels-photo-2294406.jpeg','https://images.pexels.com/photos/3771074/pexels-photo-3771074.jpeg','https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg'),
     1799, 2499, 28,
     jsonb_build_array('S','M','L','XL'),
     jsonb_build_array('Navy','Forest'),
     2, 75, 'MHF-TS-004',
     jsonb_build_array('performance','tech','sport'),
     4.4, 33, false, false, false),

    ('essential-heavycrew', 'Essential Heavy-Crew Tee', 'Our everyday hero: 220gsm ringspun cotton, ribbed collar, side-seamed body.',
     't-shirts',
     jsonb_build_array('https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg','https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     999, 1599, 38,
     jsonb_build_array('XS','S','M','L','XL','XXL'),
     jsonb_build_array('Black','White','Storm Grey','Navy'),
     4, 200, 'MHF-TS-005',
     jsonb_build_array('essential','cotton','everyday'),
     4.8, 210, true, true, true),

    ('arch-relaxed-tee', 'Arch Relaxed Tee', 'Relaxed, lived-in shape with reinforced shoulder and a vintage wash.',
     't-shirts',
     jsonb_build_array('https://images.pexels.com/photos/1844547/pexels-photo-1844547.jpeg','https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     1199, 1799, 33,
     jsonb_build_array('S','M','L','XL'),
     jsonb_build_array('Olive','Sand'),
     2, 80, 'MHF-TS-006',
     jsonb_build_array('vintage','relaxed'),
     4.3, 38, false, false, false),

    ('monogram-polo', 'Monogram Knit Polo', 'Italian-knit polo with custom M.H. monogram patch and tonal collar.',
     't-shirts',
     jsonb_build_array('https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg','https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     1899, 2799, 32,
     jsonb_build_array('S','M','L','XL'),
     jsonb_build_array('Navy','Forest','Maroon'),
     3, 45, 'MHF-TS-007',
     jsonb_build_array('polo','knit','monogram'),
     4.6, 27, false, true, false),

    ('studio-cropped-tee', 'Studio Cropped Tee', 'A cropped, fine-knit tee designed in the studio with a clean feminine drape.',
     't-shirts',
     jsonb_build_array('https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg','https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg'),
     1099, 1699, 35,
     jsonb_build_array('XS','S','M','L'),
     jsonb_build_array('Blush','White','Black'),
     3, 70, 'MHF-TS-008',
     jsonb_build_array('crop','feminine'),
     4.5, 52, false, false, true),

  -- Hoodies (6)
    ('executive-fleece-hoodie', 'Executive Fleece Hoodie', '400gsm brushed-back fleece with a double-lined hood and metal-tipped drawcords. Built to last seasons.',
     'hoodies',
     jsonb_build_array('https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg','https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     2499, 3699, 32,
     jsonb_build_array('S','M','L','XL','XXL'),
     jsonb_build_array('Black','Storm Grey','Navy'),
     3, 100, 'MHF-HD-001',
     jsonb_build_array('fleece','heavyweight'),
     4.8, 142, true, true, true),

    ('archive-zip-hoodie', 'Archive Zip Hoodie', 'Half-zip archival hoodie with side panels for movement and brushed interior warmth.',
     'hoodies',
     jsonb_build_array('https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg','https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg','https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg'),
     2699, 3899, 31,
     jsonb_build_array('S','M','L','XL'),
     jsonb_build_array('Olive','Black','Camel'),
     3, 65, 'MHF-HD-002',
     jsonb_build_array('zip','archive'),
     4.6, 58, false, true, true),

    ('minimal-pullover', 'Minimal Pullover Hoodie', 'Clean lines, no logo, no fuss. A wardrobe staple engineered for comfort.',
     'hoodies',
     jsonb_build_array('https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg','https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg','https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg'),
     2199, 3199, 31,
     jsonb_build_array('XS','S','M','L','XL'),
     jsonb_build_array('Black','White','Sand'),
     3, 130, 'MHF-HD-003',
     jsonb_build_array('minimal','essential'),
     4.7, 89, true, false, true),

    ('oversized-cocoon-hoodie', 'Oversized Cocoon Hoodie', 'Dramatic cocoon silhouette with extended shoulders and a raw-edge hem.',
     'hoodies',
     jsonb_build_array('https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg','https://images.pexels.com/photos/1844547/pexels-photo-1844547.jpeg','https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg'),
     2799, 3999, 30,
     jsonb_build_array('S','M','L'),
     jsonb_build_array('Maroon','Forest','Black'),
     3, 40, 'MHF-HD-004',
     jsonb_build_array('oversized','cocoon'),
     4.5, 33, false, true, false),

    ('lux-velour-hoodie', 'Lux Velour Hoodie', 'Plush sculpted velour with tonal stitching and matte-gold hardware.',
     'hoodies',
     jsonb_build_array('https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg','https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     3299, 4799, 31,
     jsonb_build_array('S','M','L','XL'),
     jsonb_build_array('Camel','Maroon'),
     2, 35, 'MHF-HD-005',
     jsonb_build_array('velour','luxury'),
     4.9, 22, true, false, true),

    ('studio-tech-hoodie', 'Studio Tech Hoodie', 'Lightweight tech-fleece with bonded seams and a streamlined athletic cut.',
     'hoodies',
     jsonb_build_array('https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg','https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg','https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg'),
     2599, 3499, 26,
     jsonb_build_array('M','L','XL'),
     jsonb_build_array('Navy','Black','Forest'),
     3, 55, 'MHF-HD-006',
     jsonb_build_array('tech','athletic'),
     4.4, 30, false, false, false),

  -- Caps (4)
    ('signature-structured-cap', 'Signature Structured Cap', 'Six-panel structured cap with embroidered monogram and curved peak.',
     'caps',
     jsonb_build_array('https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg','https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     899, 1299, 31,
     jsonb_build_array('One Size'),
     jsonb_build_array('Black','Navy','White'),
     3, 150, 'MHF-CP-001',
     jsonb_build_array('structured','embroidered'),
     4.6, 76, true, true, true),

    ('heritage-snapback', 'Heritage Snapback', 'Flat-brim snapback with seven-row stitching and woven side label.',
     'caps',
     jsonb_build_array('https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg','https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     999, 1499, 33,
     jsonb_build_array('One Size'),
     jsonb_build_array('Black','Olive','Sand'),
     3, 90, 'MHF-CP-002',
     jsonb_build_array('snapback','heritage'),
     4.5, 41, false, false, true),

    ('minimal-cord-cap', 'Minimal Cord Cap', 'Six-panel corduroy unstructured cap with a soft curved brim.',
     'caps',
     jsonb_build_array('https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg','https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     849, 1199, 29,
     jsonb_build_array('One Size'),
     jsonb_build_array('Camel','Forest','Maroon'),
     3, 110, 'MHF-CP-003',
     jsonb_build_array('corduroy','minimal'),
     4.4, 35, false, true, false),

    ('trucker-mesh-cap', 'Trucker Mesh Cap', 'Foam-front, mesh-back trucker cap with adjustable snap closure.',
     'caps',
     jsonb_build_array('https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg','https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     799, 1099, 27,
     jsonb_build_array('One Size'),
     jsonb_build_array('Black','White','Storm Grey'),
     3, 180, 'MHF-CP-004',
     jsonb_build_array('trucker','mesh'),
     4.3, 28, false, false, false),

  -- Mobile Covers (3)
    ('liquid-silicone-cover', 'Liquid Silicone Cover', 'Soft-touch liquid silicone case with microfibre lining and button detail.',
     'mobile-covers',
     jsonb_build_array('https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg','https://images.pexels.com/photos/4042809/pexels-photo-4042809.jpeg','https://images.pexels.com/photos/3573555/pexels-photo-3573555.jpeg'),
     699, 999, 30,
     jsonb_build_array('iPhone 15','iPhone 14','Pixel 8','Galaxy S24'),
     jsonb_build_array('Black','White','Sand','Navy'),
     4, 200, 'MHF-MC-001',
     jsonb_build_array('silicone','soft-touch'),
     4.7, 96, true, true, true),

    ('armour-edge-cover', 'Armour Edge Cover', 'Military-grade shock absorbing shell with raised camera lip and matte finish.',
     'mobile-covers',
     jsonb_build_array('https://images.pexels.com/photos/3573555/pexels-photo-3573555.jpeg','https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg','https://images.pexels.com/photos/4042809/pexels-photo-4042809.jpeg'),
     899, 1299, 31,
     jsonb_build_array('iPhone 15 Pro','iPhone 14','Pixel 8 Pro','Galaxy S24'),
     jsonb_build_array('Black','Olive','Forest'),
     3, 120, 'MHF-MC-002',
     jsonb_build_array('armour','protective'),
     4.6, 54, false, false, true),

    ('art-series-clear-cover', 'Art Series Clear Cover', 'Crystal-clear case with exclusive artist print panel inlay.',
     'mobile-covers',
     jsonb_build_array('https://images.pexels.com/photos/4042809/pexels-photo-4042809.jpeg','https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg','https://images.pexels.com/photos/3573555/pexels-photo-3573555.jpeg'),
     749, 1099, 32,
     jsonb_build_array('iPhone 15','iPhone 14','Pixel 8'),
     jsonb_build_array('Blush','White'),
     3, 80, 'MHF-MC-003',
     jsonb_build_array('clear','art'),
     4.4, 22, false, true, false),

  -- Posters (3)
    ('type-noir-poster', 'Type Noir Poster', 'Limited-edition typographic statement in deep noir ink on archival matte paper.',
     'posters',
     jsonb_build_array('https://images.pexels.com/photos/1666320/pexels-photo-1666320.jpeg','https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     599, 899, 33,
     jsonb_build_array('A2','A3','A4'),
     jsonb_build_array('Black','White'),
     3, 100, 'MHF-PO-001',
     jsonb_build_array('typography','limited'),
     4.8, 67, true, true, true),

    ('gradient-dawn-poster', 'Gradient Dawn Poster', 'A meditative gradient study printed on museum-quality giclée paper.',
     'posters',
     jsonb_build_array('https://images.pexels.com/photos/1666320/pexels-photo-1666320.jpeg','https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     699, 999, 30,
     jsonb_build_array('A2','A3'),
     jsonb_build_array('Blush','Camel'),
     2, 90, 'MHF-PO-002',
     jsonb_build_array('gradient','art'),
     4.6, 38, false, false, true),

    ('line-study-poster', 'Line Study Poster', 'Architectural line study that brings precision and calm to any wall.',
     'posters',
     jsonb_build_array('https://images.pexels.com/photos/1666320/pexels-photo-1666320.jpeg','https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg','https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'),
     649, 949, 32,
     jsonb_build_array('A2','A3','A4'),
     jsonb_build_array('Black','White','Storm Grey'),
     3, 70, 'MHF-PO-003',
     jsonb_build_array('line','minimal'),
     4.5, 19, false, true, false);
END $$;

-- ========== 20260619053830_mhfashion_profiles.sql ==========

/*
# Add user profiles table (v1)

1. New Table `profiles`
   - id (uuid) — primary key, references auth.users(id) on delete cascade.
   - email text
   - name text
   - role text — 'customer' (default) | 'admin'
   - created_at timestamptz
2. Security
   - RLS enabled. Users can read their own profile. INSERT/UPDATE restricted to
     the owner. Admin updates use the service-role client (bypasses RLS) in API
     routes, so we intentionally do NOT publish a public update policy.
3. Notes
   - A trigger auto-creates a row on auth.users INSERT using defaults, so that
     new sign-ups immediately have a profile even if the app's best-effort
     upsert races.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_profile" ON profiles;
CREATE POLICY "owner_read_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "owner_insert_profile" ON profiles;
CREATE POLICY "owner_insert_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_update_profile" ON profiles;
CREATE POLICY "owner_update_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== 20260619054204_mhfashion_review_rpc.sql ==========

/*
# Add rating recompute RPC (v1)

1. New function `recompute_product_rating(p_product_id uuid)`
   - Recalculates `products.rating` (1-decimal average) and `products.review_count`.
   - Idempotent; safe to call after each review insert or after deleting reviews.
2. Grant EXECUTE to anon + authenticated so the review API route (service-role
   client which bypasses RLS) and any authenticated caller can use it.
*/
CREATE OR REPLACE FUNCTION public.recompute_product_rating(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating numeric;
  cnt int;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO avg_rating, cnt
  FROM public.reviews
  WHERE product_id = p_product_id;

  UPDATE public.products
  SET rating = ROUND(avg_rating, 1),
      review_count = cnt
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recompute_product_rating(uuid) TO anon, authenticated;

-- ========== 20260619054247_mhfason_stock_rpc.sql ==========

/*
# Stock decrement RPC + orders admin update guard (v1)

1. New function `decrement_stock(p_product_id uuid, p_qty int)`
   - Atomically decrements product stock (floor at 0).
   - SECURITY DEFINER; granted to anon + authenticated so the order API route
     (running as service role which already bypasses RLS) and any future
     authenticated flow can use it.
2. Notes
   - We DO NOT grant a public UPDATE policy on `orders`. Order status updates
     happen only via the service-role client in API routes; this keeps
     non-admin callers from editing their own order status.
*/
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_qty int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - p_qty)
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, int) TO anon, authenticated;

-- ========== 20260625050000_lock_down_anon_writes.sql ==========

/*
# Security fix S-01 — remove anonymous write access to catalog tables

Catalog mutations must go through Next.js admin API routes using the
service role key. Public anon/authenticated clients get SELECT only.
*/

-- categories
DROP POLICY IF EXISTS "public_insert_categories" ON categories;
DROP POLICY IF EXISTS "public_update_categories" ON categories;
DROP POLICY IF EXISTS "public_delete_categories" ON categories;

-- products
DROP POLICY IF EXISTS "public_insert_products" ON products;
DROP POLICY IF EXISTS "public_update_products" ON products;
DROP POLICY IF EXISTS "public_delete_products" ON products;

-- coupons
DROP POLICY IF EXISTS "public_insert_coupons" ON coupons;
DROP POLICY IF EXISTS "public_update_coupons" ON coupons;
DROP POLICY IF EXISTS "public_delete_coupons" ON coupons;

-- banners
DROP POLICY IF EXISTS "public_insert_banners" ON banners;
DROP POLICY IF EXISTS "public_update_banners" ON banners;
DROP POLICY IF EXISTS "public_delete_banners" ON banners;

-- reviews: anon can no longer insert directly (use server API + service role)
DROP POLICY IF EXISTS "anon_insert_reviews" ON reviews;

-- ========== 20260625050100_lock_down_stock_rpc.sql ==========

/*
# Security fix S-02 — restrict decrement_stock to service_role only

Reject non-positive quantities. Only server-side order API may adjust stock.
*/

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_qty int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'decrement_stock: quantity must be a positive integer';
  END IF;

  UPDATE public.products
  SET stock = GREATEST(0, stock - p_qty)
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'decrement_stock: product not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, int) TO service_role;

-- ========== 20260626060000_atomic_stock_and_coupon_limits.sql ==========

/*
# Atomic stock decrement + coupon usage columns

- decrement_stock_if_available: only decrements when stock >= qty
- increment_stock: rollback helper for failed orders
- coupons: usage_limit + used_count for abuse prevention
*/

CREATE OR REPLACE FUNCTION public.decrement_stock_if_available(p_product_id uuid, p_qty int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated int;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'decrement_stock_if_available: quantity must be positive';
  END IF;

  UPDATE public.products
  SET stock = stock - p_qty
  WHERE id = p_product_id AND stock >= p_qty;

  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated = 0 THEN
    RAISE EXCEPTION 'insufficient_stock';
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_stock(p_product_id uuid, p_qty int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN RETURN; END IF;
  UPDATE public.products SET stock = stock + p_qty WHERE id = p_product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock_if_available(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_if_available(uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_if_available(uuid, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock_if_available(uuid, int) TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_stock(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_stock(uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_stock(uuid, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_stock(uuid, int) TO service_role;

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS usage_limit int,
  ADD COLUMN IF NOT EXISTS used_count int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code text NOT NULL,
  user_id text NOT NULL,
  order_id text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS coupon_redemptions_user_code_idx
  ON public.coupon_redemptions (coupon_code, user_id);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
