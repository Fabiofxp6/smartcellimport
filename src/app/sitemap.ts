import type { MetadataRoute } from "next";
import { connectDB, isDatabaseConfigured } from "@/lib/mongodb";
import { CategoryModel, ProductModel } from "@/models";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const urls: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "daily", priority: 0.9 },
  ];
  if (!isDatabaseConfigured()) return urls;
  await connectDB();
  const categories = await CategoryModel.find({ published: true })
    .select("slug updatedAt")
    .lean();
  const products = await ProductModel.find({
    published: true,
    categoryId: { $in: categories.map((c) => c._id) },
  })
    .select("slug updatedAt")
    .limit(45000)
    .lean();
  return [
    ...urls,
    ...categories.map((c) => ({
      url: `${base}/categoria/${c.slug}`,
      lastModified: c.updatedAt,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/produto/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.7,
    })),
  ];
}
