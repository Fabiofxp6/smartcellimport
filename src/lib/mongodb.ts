import mongoose from "mongoose";

const globalCache = globalThis as typeof globalThis & {
  mongoPromise?: Promise<typeof mongoose>;
};
export function isDatabaseConfigured() {
  return Boolean(process.env.MONGODB_URI);
}
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!globalCache.mongoPromise) {
    globalCache.mongoPromise = mongoose
      .connect(uri, {
        maxPoolSize: 5,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 7000,
        connectTimeoutMS: 7000,
        socketTimeoutMS: 20000,
        autoIndex: false,
        bufferCommands: false,
      })
      .catch((error) => {
        globalCache.mongoPromise = undefined;
        throw error;
      });
  }
  return globalCache.mongoPromise;
}
