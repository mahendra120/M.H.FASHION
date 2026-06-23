/** Static legal pages date — avoids SSR/client locale drift. */
export const LEGAL_LAST_UPDATED = '22 June 2025';

export const FREE_SHIPPING_THRESHOLD = 1499;
export const WHATSAPP_NUMBER = '919000000000';
export const BRAND = {
  name: 'M.H.Fashion',
  tagline: 'Wear Confidence',
  email: 'care@mhfashion.com',
  phone: '+91 90000 00000',
  address: 'Atelier 404, Creative District, Mumbai 400001, India',
};

export type CategorySlug =
  | 't-shirts'
  | 'hoodies'
  | 'caps'
  | 'mobile-covers'
  | 'posters';

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  't-shirts': 'T-Shirts',
  hoodies: 'Hoodies',
  caps: 'Caps',
  'mobile-covers': 'Mobile Covers',
  posters: 'Posters',
};

export const COLOR_SWATCHES: Record<string, string> = {
  Black: '#111111',
  White: '#f5f5f5',
  'Storm Grey': '#7d7f84',
  Sand: '#cdbb96',
  Olive: '#5a5938',
  Camel: '#b38b5d',
  Navy: '#1f2a44',
  Maroon: '#5a1a22',
  Forest: '#243b2d',
  Blush: '#e6b7af',
};

export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
