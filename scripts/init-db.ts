import "./env";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import {
  UserModel,
  ProductModel,
  CategoryModel,
  SettingsModel,
  RateLimitModel,
  MediaModel,
} from "../src/models";
import { defaultSettings } from "../src/lib/defaults";
async function main() {
  await connectDB();
  // createIndexes never drops existing indexes or documents.
  for (const model of [
    UserModel,
    ProductModel,
    CategoryModel,
    SettingsModel,
    RateLimitModel,
    MediaModel,
  ])
    await model.createIndexes();
  await SettingsModel.updateOne(
    { key: "main" },
    { $setOnInsert: { key: "main", ...defaultSettings } },
    { upsert: true },
  );
  console.log(
    "Índices e configurações iniciais criados. Nenhum produto ou categoria fictícia foi inserido.",
  );
}
main()
  .catch(() => {
    console.error(
      "Inicialização falhou. Confira MONGODB_URI e as permissões do banco.",
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
