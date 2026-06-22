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
