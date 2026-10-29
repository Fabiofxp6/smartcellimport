"use server";

import mongoose, { type ClientSession } from "mongoose";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  CategoryModel,
  ProductModel,
  SettingsModel,
  MediaModel,
} from "@/models";
import {
  categorySchema,
  objectId,
  productSchema,
  settingsSchema,
} from "@/lib/validations";
import { buildSearchTokens } from "@/features/products/search";
import { AppError, safeError } from "@/lib/errors";
import type { ProductImage } from "@/lib/types";

export type ActionResult =
  { ok: true; id?: string } | { ok: false; error: string };
const refresh = () => revalidatePath("/", "layout");
async function attachImages(images: ProductImage[], session: ClientSession) {
  for (const image of images) {
    const asset = await MediaModel.findOneAndUpdate(
      {
        publicId: image.publicId,
        secureUrl: image.secureUrl,
        state: { $ne: "deleting" },
      },
      { $set: { state: "attached" } },
      { session },
    );
    if (!asset)
      throw new AppError(
        "Uma imagem não está mais disponível. Envie-a novamente.",
      );
  }
}
export async function saveProduct(
  input: unknown,
  id?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = productSchema.parse(input);
    if (id) objectId.parse(id);
    let savedId = id;
    await mongoose.connection.transaction(async (session) => {
      const category = await CategoryModel.findOneAndUpdate(
        { _id: data.categoryId },
        { $inc: { refVersion: 1 } },
        { session, returnDocument: "after" },
      );
      if (!category) throw new AppError("Selecione uma categoria existente.");
      await attachImages(data.images, session);
      const document = {
        ...data,
        searchTokens: buildSearchTokens(data, category.name),
      };
      if (id) {
        const result = await ProductModel.findByIdAndUpdate(
          id,
          {
            $set: document,
            ...(data.promotionalPrice === undefined
              ? { $unset: { promotionalPrice: 1 } }
              : {}),
          },
          { session, runValidators: true },
        );
        if (!result) throw new AppError("Produto não encontrado.", 404);
      } else {
        const [product] = await ProductModel.create([document], { session });
        savedId = product._id.toString();
      }
    });
    refresh();
    return { ok: true, id: savedId };
  } catch (error) {
    return { ok: false, error: safeError(error).message };
  }
}
export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    objectId.parse(id);
    if (!(await ProductModel.findByIdAndDelete(id)))
      throw new AppError("Produto não encontrado.", 404);
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: safeError(error).message };
  }
}
export async function setProductPublished(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    objectId.parse(id);
    if (typeof published !== "boolean") throw new AppError("Status inválido.");
    if (
      !(await ProductModel.findByIdAndUpdate(
        id,
        { $set: { published } },
        { runValidators: true },
      ))
    )
      throw new AppError("Produto não encontrado.", 404);
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: safeError(error).message };
  }
}
export async function saveCategory(
  input: unknown,
  id?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = categorySchema.parse(input);
    if (id) objectId.parse(id);
    let savedId = id;
    await mongoose.connection.transaction(async (session) => {
      await attachImages(data.image ? [data.image] : [], session);
      if (id) {
        if (
          !(await CategoryModel.findByIdAndUpdate(
            id,
            { $set: data, ...(data.image ? {} : { $unset: { image: 1 } }) },
            { session, runValidators: true },
          ))
        )
          throw new AppError("Categoria não encontrada.", 404);
        // Category names participate in the search index; refresh affected documents atomically.
        const products = await ProductModel.find({ categoryId: id })
          .session(session)
          .lean();
        if (products.length)
          await ProductModel.bulkWrite(
            products.map((p) => ({
              updateOne: {
                filter: { _id: p._id },
                update: {
                  $set: {
                    searchTokens: buildSearchTokens(
                      { ...p, categoryId: id },
                      data.name,
                    ),
                  },
                },
              },
            })),
            { session },
          );
      } else {
        const [category] = await CategoryModel.create([data], { session });
        savedId = category._id.toString();
      }
    });
    refresh();
    return { ok: true, id: savedId };
  } catch (error) {
    return { ok: false, error: safeError(error).message };
  }
}
export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    objectId.parse(id);
    await mongoose.connection.transaction(async (session) => {
      // Writes to the category serialize with product creation, avoiding dangling references.
      const category = await CategoryModel.findByIdAndUpdate(
        id,
        { $inc: { refVersion: 1 } },
        { session },
      );
      if (!category) throw new AppError("Categoria não encontrada.", 404);
      if (await ProductModel.exists({ categoryId: id }).session(session))
        throw new AppError(
          "Mova ou exclua os produtos desta categoria antes de excluí-la.",
          409,
        );
      await CategoryModel.deleteOne({ _id: id }, { session });
    });
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: safeError(error).message };
  }
}
export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = settingsSchema.parse(input);
    await mongoose.connection.transaction(async (session) => {
      await attachImages(
        [data.logo, data.banner].filter((i): i is ProductImage => !!i),
        session,
      );
      const unset = {
        ...(!data.logo ? { logo: 1 } : {}),
        ...(!data.banner ? { banner: 1 } : {}),
      };
      await SettingsModel.findOneAndUpdate(
        { key: "main" },
        { $set: data, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
        { upsert: true, session, runValidators: true },
      );
    });
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: safeError(error).message };
  }
}
