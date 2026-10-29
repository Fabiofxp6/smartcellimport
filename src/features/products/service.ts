import "server-only";
import { cache } from "react";
import { Types } from "mongoose";
import { connectDB, isDatabaseConfigured } from "@/lib/mongodb";
import { CategoryModel, ProductModel } from "@/models";
import type { Category, Product } from "@/lib/types";
import { normalize } from "@/lib/utils";
import { objectId } from "@/lib/validations";
import { searchTerms } from "./search";

export function serialize<T>(record: unknown): T {
  return JSON.parse(JSON.stringify(record)) as T;
}
export const getCategories = cache(
  async (admin = false): Promise<Category[]> => {
    if (!isDatabaseConfigured()) return [];
    await connectDB();
    const rows = await CategoryModel.find(admin ? {} : { published: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    return rows.map((row) => ({
      ...serialize<Category>(row),
      id: row._id.toString(),
    }));
  },
);
export type CatalogQuery = {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  sort?: string;
  page?: number;
  attributes?: Record<string, string>;
  featured?: boolean;
};
export async function queryProducts(query: CatalogQuery = {}, admin = false) {
  const page = Math.min(1000, Math.max(1, Math.trunc(query.page || 1)));
  const empty = {
    products: [] as Product[],
    total: 0,
    pages: 0,
    page,
    facets: [] as { name: string; values: string[] }[],
  };
  if (!isDatabaseConfigured()) return empty;
  await connectDB();
  const categories = await getCategories(admin);
  const category = query.category
    ? categories.find(
        (c) => c.slug === query.category || c.id === query.category,
      )
    : undefined;
  if (query.category && !category) return empty;
  const filter: Record<string, unknown> = admin
    ? {}
    : {
        published: true,
        categoryId: { $in: categories.map((c) => new Types.ObjectId(c.id)) },
      };
  if (category) filter.categoryId = new Types.ObjectId(category.id);
  if (query.featured) filter.featured = true;
  const terms = searchTerms((query.q || "").slice(0, 200));
  if (terms.length) filter.searchTokens = { $all: terms };
  const allowedAttributes = category?.filterableAttributes || [
    ...new Set(categories.flatMap((c) => c.filterableAttributes)),
  ];
  const attrFilters = Object.entries(query.attributes || {})
    .filter(
      ([name, value]) =>
        allowedAttributes.includes(name) && value.length <= 100,
    )
    .map(([name, value]) => ({
      attributes: { $elemMatch: { name, values: value } },
    }));
  // Facets come from all matching products, before attribute/price filters and pagination.
  const facets = await ProductModel.aggregate<{
    _id: string;
    values: string[];
  }>([
    { $match: filter },
    { $unwind: "$attributes" },
    { $match: { "attributes.name": { $in: allowedAttributes } } },
    { $unwind: "$attributes.values" },
    {
      $group: {
        _id: "$attributes.name",
        values: { $addToSet: "$attributes.values" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const conditions: Record<string, unknown>[] = [...attrFilters];
  if (query.min !== undefined || query.max !== undefined) {
    const price = { $ifNull: ["$promotionalPrice", "$basePrice"] };
    if (query.min !== undefined)
      conditions.push({ $expr: { $gte: [price, query.min] } });
    if (query.max !== undefined)
      conditions.push({ $expr: { $lte: [price, query.max] } });
  }
  if (conditions.length) filter.$and = conditions;
  const total = await ProductModel.countDocuments(filter);
  const sort: Record<string, 1 | -1> =
    query.sort === "price-asc"
      ? { effectivePrice: 1, _id: 1 }
      : query.sort === "price-desc"
        ? { effectivePrice: -1, _id: 1 }
        : query.sort === "name"
          ? { name: 1, _id: 1 }
          : terms.length
            ? { relevance: -1, createdAt: -1, _id: 1 }
            : { createdAt: -1, _id: 1 };
  const rows = await ProductModel.aggregate([
    { $match: filter },
    {
      $addFields: {
        effectivePrice: { $ifNull: ["$promotionalPrice", "$basePrice"] },
        relevance: terms.length
          ? {
              $sum: terms.map((term) => ({
                $cond: [
                  {
                    $regexMatch: { input: { $toLower: "$name" }, regex: term },
                  },
                  1,
                  0,
                ],
              })),
            }
          : 0,
      },
    },
    { $sort: sort },
    { $skip: (page - 1) * 12 },
    { $limit: 12 },
    { $unset: ["searchTokens", "effectivePrice", "relevance", "__v"] },
  ]);
  return {
    products: rows.map((row) => mapProduct(row, categories)),
    total,
    pages: Math.ceil(total / 12),
    page,
    facets: facets.map((f) => ({
      name: f._id,
      values: f.values.sort((a, b) => a.localeCompare(b, "pt-BR")),
    })),
  };
}
function mapProduct(
  row: { _id: Types.ObjectId; categoryId: Types.ObjectId },
  categories: Category[],
): Product {
  const data = serialize<Product>(row);
  const category = categories.find((c) => c.id === String(row.categoryId));
  return {
    ...data,
    id: String(row._id),
    categoryId: String(row.categoryId),
    category: category
      ? { name: category.name, slug: category.slug }
      : undefined,
  };
}
export const getProduct = cache(
  async (slugOrId: string, admin = false): Promise<Product | null> => {
    if (!isDatabaseConfigured()) return null;
    await connectDB();
    const byId = objectId.safeParse(slugOrId).success;
    const product = await ProductModel.findOne({
      ...(byId && admin ? { _id: slugOrId } : { slug: slugOrId }),
      ...(admin ? {} : { published: true }),
    })
      .select("-searchTokens -__v")
      .lean();
    if (!product) return null;
    const categories = await getCategories(admin);
    if (!admin && !categories.some((c) => c.id === String(product.categoryId)))
      return null;
    return mapProduct(product, categories);
  },
);
export async function dashboardStats() {
  await connectDB();
  const [total, categories, published, featured] = await Promise.all([
    ProductModel.countDocuments(),
    CategoryModel.countDocuments(),
    ProductModel.countDocuments({ published: true }),
    ProductModel.countDocuments({ featured: true }),
  ]);
  return { total, categories, published, hidden: total - published, featured };
}
export { normalize };
