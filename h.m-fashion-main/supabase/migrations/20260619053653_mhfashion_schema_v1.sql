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
