import type { CategorySlug } from '@/lib/constants';

export type Role = 'customer' | 'admin';

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: CategorySlug | string;
  images: string[];
  price: number;
  original_price: number | null;
  discount: number;
  sizes: string[];
  colors: string[];
  variants: number;
  stock: number;
  sku: string;
  tags: string[];
  rating: number;
  review_count: number;
  featured: boolean;
  new_arrival: boolean;
  trending: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  name: string;
  email_hash: string | null | undefined;
  rating: number;
  title: string;
  body: string;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  image: string;
  status: 'active' | 'inactive';
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'flat';
  discount_value: number;
  min_order: number;
  expiry_date: string;
  active: boolean;
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  active: boolean;
}

export interface OrderItem {
  product_id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'card' | 'upi' | 'cod';

export interface Order {
  id: string;
  user_email: string | null;
  user_id: string | null;
  items: OrderItem[];
  total_amount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: OrderStatus;
  shipping_address: {
    full_name: string;
    phone: string;
    email: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  stock: number;
}

export interface WishlistItem {
  product_id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  added_at: string;
}

export interface ProductInput {
  title: string;
  slug?: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  original_price?: number | null;
  sizes: string[];
  colors: string[];
  variants?: number;
  stock: number;
  sku: string;
  tags?: string[];
  featured?: boolean;
  new_arrival?: boolean;
  trending?: boolean;
}

export interface ReviewInput {
  product_id: string;
  name: string;
  rating: number;
  title: string;
  body: string;
}
