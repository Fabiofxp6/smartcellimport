import type { Product, ProductImage } from "@/lib/types";
export const image: ProductImage = {
  publicId: "smartcell/test",
  secureUrl: "https://res.cloudinary.com/test/image/upload/test.jpg",
  alt: "Capa",
  sortOrder: 0,
  isPrimary: true,
};
export const fixture: Product = {
  id: "000000000000000000000001",
  name: "Capa Silicone Premium",
  slug: "capa-silicone-premium",
  description: "Capa para proteção do seu iPhone.",
  categoryId: "000000000000000000000002",
  basePrice: 3990,
  images: [image],
  keywords: ["proteção"],
  attributes: [
    { name: "Modelo", values: ["iPhone 17", "iPhone 17 Pro"] },
    { name: "Cor", values: ["Rosa", "Preta"] },
  ],
  variants: [
    {
      id: "rosa",
      attributes: [
        { name: "Modelo", value: "iPhone 17" },
        { name: "Cor", value: "Rosa" },
      ],
    },
    {
      id: "preta",
      attributes: [
        { name: "Modelo", value: "iPhone 17 Pro" },
        { name: "Cor", value: "Preta" },
      ],
      priceOverride: 4590,
    },
  ],
  published: true,
  featured: true,
  createdAt: "2026-10-29T00:00:00Z",
};
