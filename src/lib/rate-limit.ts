import { createHash } from "node:crypto";
import { connectDB } from "./mongodb";
import { RateLimitModel } from "@/models";
import { AppError } from "./errors";
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
) {
  await connectDB();
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = createHash("sha256")
    .update(`${identifier}:${bucket}`)
    .digest("hex");
  let record;
  try {
    record = await RateLimitModel.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          expiresAt: new Date((bucket + 1) * windowSeconds * 1000),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    )
      record = await RateLimitModel.findOneAndUpdate(
        { key },
        { $inc: { count: 1 } },
        { returnDocument: "after" },
      );
    else throw error;
  }
  if (!record || record.count > limit)
    throw new AppError(
      "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
      429,
    );
}
