import type { Banner, Category, Product } from '@/types';

const BASE = '2026-01-15T00:00:00.000Z';

function p(
  slug: string,
  title: string,
  description: string,
  category: string,
  images: string[],
  price: number,
  original_price: number,
  discount: number,
  sizes: string[],
  colors: string[],
  variants: number,
  stock: number,
  sku: string,
  tags: string[],
  rating: number,
  review_count: number,
  featured: boolean,
  new_arrival: boolean,
  trending: boolean,
): Product {
  return {
    id: `demo-${slug}`,
    slug,
    title,
    description,
    category,
    images,
    price,
    original_price,
    discount,
    sizes,
    colors,
    variants,
    stock,
    sku,
    tags,
    rating,
    review_count,
    featured,
    new_arrival,
    trending,
    created_at: BASE,
  };
}

export const DEMO_CATEGORIES: Category[] = [
  { id: 'demo-cat-t-shirts', slug: 't-shirts', name: 'T-Shirts', image: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=1200', status: 'active' },
  { id: 'demo-cat-hoodies', slug: 'hoodies', name: 'Hoodies', image: 'https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg?auto=compress&cs=tinysrgb&w=1200', status: 'active' },
  { id: 'demo-cat-caps', slug: 'caps', name: 'Caps', image: 'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=1200', status: 'active' },
  { id: 'demo-cat-mobile-covers', slug: 'mobile-covers', name: 'Mobile Covers', image: 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg?auto=compress&cs=tinysrgb&w=1200', status: 'active' },
  { id: 'demo-cat-posters', slug: 'posters', name: 'Posters', image: 'https://images.pexels.com/photos/1666320/pexels-photo-1666320.jpeg?auto=compress&cs=tinysrgb&w=1200', status: 'active' },
];

export const DEMO_BANNERS: Banner[] = [
  { id: 'demo-banner-1', title: 'New Season Drop — FW Limited Edition', image: 'https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=1920', link: '/shop', active: true },
  { id: 'demo-banner-2', title: 'Everyday Elevated — Premium Essentials', image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=1920', link: '/shop?cat=t-shirts', active: true },
  { id: 'demo-banner-3', title: 'Art You Can Wear — Poster Series Vol. 02', image: 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg?auto=compress&cs=tinysrgb&w=1920', link: '/shop?cat=posters', active: true },
];

export const DEMO_PRODUCTS: Product[] = [
  p('monochrome-oversized-tee', 'Monochrome Oversized Tee', 'A heavyweight 240gsm cotton tee with a boxy, structured silhouette. Garment-dyed for depth and soft hand feel.', 't-shirts', ['https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg', 'https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg', 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg'], 1499, 2299, 35, ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'White', 'Storm Grey'], 3, 120, 'MHF-TS-001', ['oversized', 'cotton', 'unisex'], 4.7, 128, true, true, true),
  p('atelier-boxy-tee', 'Atelier Boxy Tee', 'Minimal boxy fit crew in pima cotton with a soft brushed interior and dropped shoulders.', 't-shirts', ['https://images.pexels.com/photos/1666738/pexels-photo-1666738.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg', 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg'], 1299, 1899, 32, ['XS', 'S', 'M', 'L', 'XL'], ['Sand', 'Olive', 'Black'], 3, 90, 'MHF-TS-002', ['boxy', 'minimal'], 4.5, 64, false, true, true),
  p('gradient-hoodie-tee', 'Gradient Brush Tee', 'Hand-painted gradient across an enzyme-washed cotton base. A piece that wears like art.', 't-shirts', ['https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg', 'https://images.pexels.com/photos/1656683/pexels-photo-1656683.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 1599, 2399, 33, ['S', 'M', 'L'], ['Camel', 'Maroon'], 2, 60, 'MHF-TS-003', ['gradient', 'art'], 4.6, 41, true, false, true),
  p('tech-knit-performance-tee', 'Tech-Knit Performance Tee', 'Moisture-wicking engineered knit with flat-lock seams and a sport-luxe drape.', 't-shirts', ['https://images.pexels.com/photos/2294406/pexels-photo-2294406.jpeg', 'https://images.pexels.com/photos/3771074/pexels-photo-3771074.jpeg', 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg'], 1799, 2499, 28, ['S', 'M', 'L', 'XL'], ['Navy', 'Forest'], 2, 75, 'MHF-TS-004', ['performance', 'tech', 'sport'], 4.4, 33, false, false, false),
  p('essential-heavycrew', 'Essential Heavy-Crew Tee', 'Our everyday hero: 220gsm ringspun cotton, ribbed collar, side-seamed body.', 't-shirts', ['https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg', 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 999, 1599, 38, ['XS', 'S', 'M', 'L', 'XL', 'XXL'], ['Black', 'White', 'Storm Grey', 'Navy'], 4, 200, 'MHF-TS-005', ['essential', 'cotton', 'everyday'], 4.8, 210, true, true, true),
  p('arch-relaxed-tee', 'Arch Relaxed Tee', 'Relaxed, lived-in shape with reinforced shoulder and a vintage wash.', 't-shirts', ['https://images.pexels.com/photos/1844547/pexels-photo-1844547.jpeg', 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 1199, 1799, 33, ['S', 'M', 'L', 'XL'], ['Olive', 'Sand'], 2, 80, 'MHF-TS-006', ['vintage', 'relaxed'], 4.3, 38, false, false, false),
  p('monogram-polo', 'Monogram Knit Polo', 'Italian-knit polo with custom M.H. monogram patch and tonal collar.', 't-shirts', ['https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg', 'https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 1899, 2799, 32, ['S', 'M', 'L', 'XL'], ['Navy', 'Forest', 'Maroon'], 3, 45, 'MHF-TS-007', ['polo', 'knit', 'monogram'], 4.6, 27, false, true, false),
  p('studio-cropped-tee', 'Studio Cropped Tee', 'A cropped, fine-knit tee designed in the studio with a clean feminine drape.', 't-shirts', ['https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg', 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg'], 1099, 1699, 35, ['XS', 'S', 'M', 'L'], ['Blush', 'White', 'Black'], 3, 70, 'MHF-TS-008', ['crop', 'feminine'], 4.5, 52, false, false, true),
  p('executive-fleece-hoodie', 'Executive Fleece Hoodie', '400gsm brushed-back fleece with a double-lined hood and metal-tipped drawcords. Built to last seasons.', 'hoodies', ['https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg', 'https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 2499, 3699, 32, ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Storm Grey', 'Navy'], 3, 100, 'MHF-HD-001', ['fleece', 'heavyweight'], 4.8, 142, true, true, true),
  p('archive-zip-hoodie', 'Archive Zip Hoodie', 'Half-zip archival hoodie with side panels for movement and brushed interior warmth.', 'hoodies', ['https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg', 'https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg', 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg'], 2699, 3899, 31, ['S', 'M', 'L', 'XL'], ['Olive', 'Black', 'Camel'], 3, 65, 'MHF-HD-002', ['zip', 'archive'], 4.6, 58, false, true, true),
  p('minimal-pullover', 'Minimal Pullover Hoodie', 'Clean lines, no logo, no fuss. A wardrobe staple engineered for comfort.', 'hoodies', ['https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg', 'https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg', 'https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg'], 2199, 3199, 31, ['XS', 'S', 'M', 'L', 'XL'], ['Black', 'White', 'Sand'], 3, 130, 'MHF-HD-003', ['minimal', 'essential'], 4.7, 89, true, false, true),
  p('oversized-cocoon-hoodie', 'Oversized Cocoon Hoodie', 'Dramatic cocoon silhouette with extended shoulders and a raw-edge hem.', 'hoodies', ['https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg', 'https://images.pexels.com/photos/1844547/pexels-photo-1844547.jpeg', 'https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg'], 2799, 3999, 30, ['S', 'M', 'L'], ['Maroon', 'Forest', 'Black'], 3, 40, 'MHF-HD-004', ['oversized', 'cocoon'], 4.5, 33, false, true, false),
  p('lux-velour-hoodie', 'Lux Velour Hoodie', 'Plush sculpted velour with tonal stitching and matte-gold hardware.', 'hoodies', ['https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg', 'https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 3299, 4799, 31, ['S', 'M', 'L', 'XL'], ['Camel', 'Maroon'], 2, 35, 'MHF-HD-005', ['velour', 'luxury'], 4.9, 22, true, false, true),
  p('studio-tech-hoodie', 'Studio Tech Hoodie', 'Lightweight tech-fleece with bonded seams and a streamlined athletic cut.', 'hoodies', ['https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg', 'https://images.pexels.com/photos/8217423/pexels-photo-8217423.jpeg', 'https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg'], 2599, 3499, 26, ['M', 'L', 'XL'], ['Navy', 'Black', 'Forest'], 3, 55, 'MHF-HD-006', ['tech', 'athletic'], 4.4, 30, false, false, false),
  p('signature-structured-cap', 'Signature Structured Cap', 'Six-panel structured cap with embroidered monogram and curved peak.', 'caps', ['https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 899, 1299, 31, ['One Size'], ['Black', 'Navy', 'White'], 3, 150, 'MHF-CP-001', ['structured', 'embroidered'], 4.6, 76, true, true, true),
  p('heritage-snapback', 'Heritage Snapback', 'Flat-brim snapback with seven-row stitching and woven side label.', 'caps', ['https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 999, 1499, 33, ['One Size'], ['Black', 'Olive', 'Sand'], 3, 90, 'MHF-CP-002', ['snapback', 'heritage'], 4.5, 41, false, false, true),
  p('minimal-cord-cap', 'Minimal Cord Cap', 'Six-panel corduroy unstructured cap with a soft curved brim.', 'caps', ['https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 849, 1199, 29, ['One Size'], ['Camel', 'Forest', 'Maroon'], 3, 110, 'MHF-CP-003', ['corduroy', 'minimal'], 4.4, 35, false, true, false),
  p('trucker-mesh-cap', 'Trucker Mesh Cap', 'Foam-front, mesh-back trucker cap with adjustable snap closure.', 'caps', ['https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 799, 1099, 27, ['One Size'], ['Black', 'White', 'Storm Grey'], 3, 180, 'MHF-CP-004', ['trucker', 'mesh'], 4.3, 28, false, false, false),
  p('liquid-silicone-cover', 'Liquid Silicone Cover', 'Soft-touch liquid silicone case with microfibre lining and button detail.', 'mobile-covers', ['https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg', 'https://images.pexels.com/photos/4042809/pexels-photo-4042809.jpeg', 'https://images.pexels.com/photos/3573555/pexels-photo-3573555.jpeg'], 699, 999, 30, ['iPhone 15', 'iPhone 14', 'Pixel 8', 'Galaxy S24'], ['Black', 'White', 'Sand', 'Navy'], 4, 200, 'MHF-MC-001', ['silicone', 'soft-touch'], 4.7, 96, true, true, true),
  p('armour-edge-cover', 'Armour Edge Cover', 'Military-grade shock absorbing shell with raised camera lip and matte finish.', 'mobile-covers', ['https://images.pexels.com/photos/3573555/pexels-photo-3573555.jpeg', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg', 'https://images.pexels.com/photos/4042809/pexels-photo-4042809.jpeg'], 899, 1299, 31, ['iPhone 15 Pro', 'iPhone 14', 'Pixel 8 Pro', 'Galaxy S24'], ['Black', 'Olive', 'Forest'], 3, 120, 'MHF-MC-002', ['armour', 'protective'], 4.6, 54, false, false, true),
  p('art-series-clear-cover', 'Art Series Clear Cover', 'Crystal-clear case with exclusive artist print panel inlay.', 'mobile-covers', ['https://images.pexels.com/photos/4042809/pexels-photo-4042809.jpeg', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg', 'https://images.pexels.com/photos/3573555/pexels-photo-3573555.jpeg'], 749, 1099, 32, ['iPhone 15', 'iPhone 14', 'Pixel 8'], ['Blush', 'White'], 3, 80, 'MHF-MC-003', ['clear', 'art'], 4.4, 22, false, true, false),
  p('type-noir-poster', 'Type Noir Poster', 'Limited-edition typographic statement in deep noir ink on archival matte paper.', 'posters', ['https://images.pexels.com/photos/1666320/pexels-photo-1666320.jpeg', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 599, 899, 33, ['A2', 'A3', 'A4'], ['Black', 'White'], 3, 100, 'MHF-PO-001', ['typography', 'limited'], 4.8, 67, true, true, true),
  p('gradient-dawn-poster', 'Gradient Dawn Poster', 'A meditative gradient study printed on museum-quality giclée paper.', 'posters', ['https://images.pexels.com/photos/1666320/pexels-photo-1666320.jpeg', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 699, 999, 30, ['A2', 'A3'], ['Blush', 'Camel'], 2, 90, 'MHF-PO-002', ['gradient', 'art'], 4.6, 38, false, false, true),
  p('line-study-poster', 'Line Study Poster', 'Architectural line study that brings precision and calm to any wall.', 'posters', ['https://images.pexels.com/photos/1666320/pexels-photo-1666320.jpeg', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'], 649, 949, 32, ['A2', 'A3', 'A4'], ['Black', 'White', 'Storm Grey'], 3, 70, 'MHF-PO-003', ['line', 'minimal'], 4.5, 19, false, true, false),
];

export interface ProductQuery {
  cat?: string;
  q?: string;
  sort?: string;
  featured?: boolean;
  newArrival?: boolean;
  trending?: boolean;
  page?: number;
  limit?: number;
}

export function queryDemoProducts(opts: ProductQuery = {}) {
  const { cat, q, sort = 'new', featured, newArrival, trending, page = 1, limit = 24 } = opts;
  let list = [...DEMO_PRODUCTS];

  if (cat) list = list.filter((p) => p.category === cat);
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle),
    );
  }
  if (featured) list = list.filter((p) => p.featured);
  if (newArrival) list = list.filter((p) => p.new_arrival);
  if (trending) list = list.filter((p) => p.trending);

  switch (sort) {
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'popular':
      list.sort((a, b) => b.review_count - a.review_count);
      break;
    case 'new':
    default:
      list.sort((a, b) => {
        if (a.new_arrival !== b.new_arrival) return a.new_arrival ? -1 : 1;
        return b.created_at.localeCompare(a.created_at);
      });
  }

  const total = list.length;
  const from = (page - 1) * limit;
  const products = list.slice(from, from + limit);
  return { products, total, page, limit };
}

export function getDemoProductBySlug(slug: string) {
  return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
}
