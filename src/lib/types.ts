export type ProductImage = {
  publicId: string;
  secureUrl: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
};
export type Attribute = { name: string; values: string[] };
export type Variant = {
  id: string;
  sku?: string;
  attributes: { name: string; value: string }[];
  priceOverride?: number;
};
export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: ProductImage;
  published: boolean;
  sortOrder: number;
  filterableAttributes: string[];
};
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  category?: Pick<Category, "name" | "slug">;
  basePrice: number;
  promotionalPrice?: number;
  sku?: string;
  images: ProductImage[];
  keywords: string[];
  attributes: Attribute[];
  variants: Variant[];
  published: boolean;
  featured: boolean;
  createdAt: string;
};
export type StoreSettings = {
  storeName: string;
  description: string;
  logo?: ProductImage;
  banner?: ProductImage;
  bannerTitle: string;
  bannerSubtitle: string;
  whatsappNumber: string;
  whatsappMessage: string;
  attendants: { name: string; number: string }[];
  socialLinks: { label: string; url: string }[];
  contactInformation: string;
};
export type CartLine = {
  productId: string;
  variantId?: string;
  quantity: number;
  name: string;
  slug: string;
  image?: string;
  unitPrice: number;
  attributes: { name: string; value: string }[];
};
export type CartInput = Pick<
  CartLine,
  "productId" | "variantId" | "quantity"
> & {
  expectedPrice: number;
  expectedAttributes?: { name: string; value: string }[];
};
