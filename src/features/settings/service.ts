import "server-only";
import { cache } from "react";
import { connectDB, isDatabaseConfigured } from "@/lib/mongodb";
import { defaultSettings } from "@/lib/defaults";
import { SettingsModel } from "@/models";
import type { StoreSettings } from "@/lib/types";

export const getSettings = cache(async (): Promise<StoreSettings> => {
  if (!isDatabaseConfigured()) return defaultSettings;
  await connectDB();
  const settings = await SettingsModel.findOne({ key: "main" })
    .select("-__v -_id -key -createdAt -updatedAt")
    .lean();
  return settings
    ? (JSON.parse(JSON.stringify(settings)) as StoreSettings)
    : defaultSettings;
});
