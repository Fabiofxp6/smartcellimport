import mongoose, { type Model, type Types } from "mongoose";
const { Schema, model, models } = mongoose;
import type { Product, Category, StoreSettings } from "@/lib/types";

type ProductRecord = Omit<
  Product,
  "id" | "category" | "categoryId" | "createdAt"
> & {
  _id: Types.ObjectId;
  categoryId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  searchTokens: string[];
};
type CategoryRecord = Omit<Category, "id"> & {
  _id: Types.ObjectId;
  refVersion: number;
  createdAt: Date;
  updatedAt: Date;
};
type UserRecord = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN";
  active: boolean;
};
const image = new Schema(
  {
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    alt: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);
const attribute = new Schema(
  { name: { type: String, required: true }, values: [String] },
  { _id: false },
);
const variant = new Schema(
  {
    id: { type: String, required: true },
    sku: String,
    attributes: [{ _id: false, name: String, value: String }],
    priceOverride: { type: Number, min: 0 },
  },
  { _id: false },
);
const product = new Schema<ProductRecord>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, required: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    promotionalPrice: { type: Number, min: 0, validate: Number.isSafeInteger },
    sku: String,
    images: [image],
    keywords: [String],
    attributes: [attribute],
    variants: [variant],
    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    searchTokens: [String],
  },
  { timestamps: true, strict: "throw" },
);
product.index({ slug: 1 }, { unique: true });
product.index({ published: 1, categoryId: 1, createdAt: -1 });
product.index({ published: 1, featured: 1, createdAt: -1 });
product.index({ published: 1, searchTokens: 1 });
product.index({ published: 1, "attributes.name": 1, "attributes.values": 1 });
const category = new Schema<CategoryRecord>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: "" },
    image,
    published: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    filterableAttributes: [String],
    refVersion: { type: Number, default: 0 },
  },
  { timestamps: true, strict: "throw" },
);
category.index({ slug: 1 }, { unique: true });
category.index({ published: 1, sortOrder: 1 });
const user = new Schema<UserRecord>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN"], default: "ADMIN" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, strict: "throw" },
);
user.index({ email: 1 }, { unique: true });
const settings = new Schema<StoreSettings & { key: string }>(
  {
    key: { type: String, default: "main" },
    storeName: String,
    description: String,
    logo: image,
    banner: image,
    bannerTitle: String,
    bannerSubtitle: String,
    whatsappNumber: String,
    whatsappMessage: String,
    attendants: [{ _id: false, name: String, number: String }],
    socialLinks: [{ _id: false, label: String, url: String }],
    contactInformation: String,
  },
  { timestamps: true, collection: "store_settings", strict: "throw" },
);
settings.index({ key: 1 }, { unique: true });
const rateLimit = new Schema(
  {
    key: { type: String, required: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { collection: "rate_limits" },
);
rateLimit.index({ key: 1 }, { unique: true });
rateLimit.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const media = new Schema(
  {
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    state: {
      type: String,
      enum: ["uploaded", "attached", "deleting"],
      default: "uploaded",
    },
    lastError: String,
  },
  { timestamps: true, collection: "media_assets" },
);
media.index({ publicId: 1 }, { unique: true });
media.index({ state: 1, updatedAt: 1 });
export const ProductModel =
  (models.Product as Model<ProductRecord>) ||
  model<ProductRecord>("Product", product);
export const CategoryModel =
  (models.Category as Model<CategoryRecord>) ||
  model<CategoryRecord>("Category", category);
export const UserModel =
  (models.User as Model<UserRecord>) || model<UserRecord>("User", user);
export const SettingsModel =
  (models.StoreSettings as Model<StoreSettings & { key: string }>) ||
  model<StoreSettings & { key: string }>("StoreSettings", settings);
export const RateLimitModel = models.RateLimit || model("RateLimit", rateLimit);
export const MediaModel = models.MediaAsset || model("MediaAsset", media);
