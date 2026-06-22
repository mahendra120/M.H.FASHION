import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IWishlist {
  user_id: string;
  product_id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  added_at: Date;
}

export interface IWishlistDocument extends IWishlist, Document {
  _id: mongoose.Types.ObjectId;
}

const WishlistSchema = new Schema<IWishlistDocument>(
  {
    user_id: { type: String, required: true, index: true },
    product_id: { type: String, required: true },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    added_at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

WishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

export const Wishlist: Model<IWishlistDocument> =
  mongoose.models.Wishlist ?? mongoose.model<IWishlistDocument>('Wishlist', WishlistSchema);
