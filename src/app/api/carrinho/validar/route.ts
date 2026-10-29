import { NextResponse } from "next/server";
import { cartInputSchema } from "@/lib/validations";
import { connectDB } from "@/lib/mongodb";
import { CategoryModel, ProductModel } from "@/models";
import { serialize } from "@/features/products/service";
import { reconcileCart } from "@/features/cart/revalidate";
import { getSettings } from "@/features/settings/service";
import { whatsappLink } from "@/features/cart/cart";
import { safeError, AppError } from "@/lib/errors";
import type { Product } from "@/lib/types";
import { readBody } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const raw = (await readBody(request, 128 * 1024)).toString("utf8");
    const data = cartInputSchema.parse(JSON.parse(raw));
    await connectDB();
    const categories = await CategoryModel.find({ published: true })
      .select("_id")
      .lean();
    const products = await ProductModel.find({
      _id: { $in: data.items.map((i) => i.productId) },
      published: true,
      categoryId: { $in: categories.map((c) => c._id) },
    })
      .select("-searchTokens")
      .lean();
    const result = reconcileCart(
      data.items,
      products.map((p) => ({
        ...serialize<Product>(p),
        id: p._id.toString(),
        categoryId: p.categoryId.toString(),
      })),
    );
    const settings = await getSettings();
    const attendant = data.attendant
      ? settings.attendants.find((a) => a.name === data.attendant)
      : undefined;
    if (data.attendant && !attendant)
      throw new AppError("Selecione uma atendente válida.");
    const url =
      !result.changed && !result.issues.length
        ? whatsappLink(
            attendant?.number || settings.whatsappNumber,
            settings.whatsappMessage,
            result.items,
          )
        : undefined;
    return NextResponse.json(
      { ...result, url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const problem = safeError(error);
    return NextResponse.json(
      { error: problem.message },
      { status: problem.status },
    );
  }
}
