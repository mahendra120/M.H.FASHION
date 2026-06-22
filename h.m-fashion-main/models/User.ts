import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type MongoUserRole = 'user' | 'admin';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: MongoUserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.index({ email: 1 }, { unique: true });

export const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema);
