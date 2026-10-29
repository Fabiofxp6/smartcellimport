import "./env";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import { getCloudinary } from "../src/lib/cloudinary";
import {
  ProductModel,
  CategoryModel,
  SettingsModel,
  MediaModel,
} from "../src/models";
async function main() {
  await connectDB();
  const cloud = getCloudinary();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const assets = await MediaModel.find({ updatedAt: { $lt: cutoff } })
    .limit(100)
    .lean();
  let removed = 0;
  for (const asset of assets) {
    let claimed = false;
    await mongoose.connection.transaction(async (session) => {
      claimed = false;
      // Serialize attachment and cleanup through the same media record.
      const record = await MediaModel.findOneAndUpdate(
        { _id: asset._id, updatedAt: { $lt: cutoff } },
        { $set: { state: "deleting" } },
        { session },
      );
      if (!record) return;
      const references = [
        await ProductModel.exists({
          "images.publicId": asset.publicId,
        }).session(session),
        await CategoryModel.exists({
          "image.publicId": asset.publicId,
        }).session(session),
        await SettingsModel.exists({
          $or: [
            { "logo.publicId": asset.publicId },
            { "banner.publicId": asset.publicId },
          ],
        }).session(session),
      ];
      if (references.some(Boolean)) {
        await MediaModel.updateOne(
          { _id: asset._id },
          { $set: { state: "attached" } },
          { session },
        );
        return;
      }
      claimed = true;
    });
    if (!claimed) continue;
    try {
      const result = await cloud.uploader.destroy(asset.publicId, {
        invalidate: true,
        resource_type: "image",
      });
      if (!["ok", "not found"].includes(result.result))
        throw new Error("DESTROY_FAILED");
      await MediaModel.deleteOne({ _id: asset._id, state: "deleting" });
      removed++;
    } catch {
      await MediaModel.updateOne(
        { _id: asset._id },
        {
          $set: {
            lastError: "Falha ao excluir no Cloudinary; repetir a limpeza.",
          },
        },
      );
    }
  }
  console.log(
    `Limpeza concluída: ${removed} imagens órfãs excluídas. Falhas são mantidas para nova tentativa.`,
  );
}
main()
  .catch(() => {
    console.error("Limpeza indisponível. Verifique MongoDB e Cloudinary.");
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
