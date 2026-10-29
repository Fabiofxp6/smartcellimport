import { hash, verify, argon2id } from "argon2";
import { connectDB } from "@/lib/mongodb";
import { loginSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { UserModel } from "@/models";

export async function authenticateAdmin(credentials: unknown, ip: string) {
  const result = loginSchema.safeParse(credentials);
  if (!result.success) return null;
  await rateLimit(`login:ip:${ip}`, 30, 900);
  await rateLimit(`login:email:${result.data.email}`, 8, 900);
  await connectDB();
  const user = await UserModel.findOne({
    email: result.data.email,
    active: true,
    role: "ADMIN",
  }).select("+passwordHash");
  if (!user) {
    // Keep an expensive password operation on the unknown-account path as well.
    await hash("smartcell-dummy-password", {
      type: argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });
    return null;
  }
  if (!(await verify(user.passwordHash, result.data.password))) return null;
  return { id: user._id.toString(), name: user.name, email: user.email };
}
