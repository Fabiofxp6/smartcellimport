import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { AppError } from "./errors";
export function getCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)
    throw new AppError(
      "Configure as credenciais do Cloudinary para enviar imagens.",
      503,
    );
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}
export function detectImage(buffer: Uint8Array): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => buffer[i] === v))
    return "image/png";
  if (
    Buffer.from(buffer.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(buffer.subarray(8, 12)).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}
export async function uploadImage(buffer: Buffer) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(
      {
        folder: "smartcell",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          { width: 2000, height: 2000, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) =>
        error || !result
          ? reject(error || new Error("UPLOAD_FAILED"))
          : resolve(result),
    );
    stream.end(buffer);
  });
}
