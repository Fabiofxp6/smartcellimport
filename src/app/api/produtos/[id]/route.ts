import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { objectId } from "@/lib/validations";
import { CategoryModel, ProductModel } from "@/models";
import { serialize } from "@/features/products/service";
import { AppError, safeError } from "@/lib/errors";
import type { Product } from "@/lib/types";
export const runtime = "nodejs";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    objectId.parse(id);
    await connectDB();
    const product = await ProductModel.findOne({ _id: id, published: true })
      .select("-searchTokens -__v")
      .lean();
    if (
      !product ||
      !(await CategoryModel.exists({
        _id: product.categoryId,
        published: true,
      }))
    )
      throw new AppError("Este produto não está mais no catálogo.", 404);
    return NextResponse.json(
      {
        ...serialize<Product>(product),
        id: product._id.toString(),
        categoryId: product.categoryId.toString(),
      },
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
