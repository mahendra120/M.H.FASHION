import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { OrderItem, OrderStatus, PaymentMethod } from '@/types';

export interface IShippingAddress {
  full_name: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IOrder {
  user_id: string | null;
  user_email: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total_amount: number;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: OrderStatus;
  shipping_address: IShippingAddress;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {
  _id: mongoose.Types.ObjectId;
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    product_id: { type: String, required: true },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
  },
  { _id: false },
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    user_id: { type: String, default: null },
    user_email: { type: String, default: null },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    total_amount: { type: Number, required: true, min: 0 },
    coupon_code: { type: String, default: null },
    payment_method: { type: String, enum: ['card', 'upi', 'cod'], required: true },
    payment_status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    order_status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shipping_address: { type: ShippingAddressSchema, required: true },
  },
  { timestamps: true },
);

OrderSchema.index({ user_id: 1 });
OrderSchema.index({ user_email: 1 });
OrderSchema.index({ order_status: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order: Model<IOrderDocument> =
  mongoose.models.Order ?? mongoose.model<IOrderDocument>('Order', OrderSchema);
