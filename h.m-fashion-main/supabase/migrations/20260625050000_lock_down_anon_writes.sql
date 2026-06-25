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
