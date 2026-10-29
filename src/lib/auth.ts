import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "./mongodb";
import { UserModel } from "@/models";
import { authenticateAdmin } from "@/features/auth/authenticate";
import { AppError } from "./errors";
import { redirect } from "next/navigation";

// Auth.js v4 reads NEXTAUTH_URL internally; keep the requested AUTH_URL as the public configuration.
if (process.env.AUTH_URL) process.env.NEXTAUTH_URL = process.env.AUTH_URL;

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!process.env.AUTH_SECRET) return null;
        try {
          const forwarded =
            req.headers?.["x-vercel-forwarded-for"] ||
            req.headers?.["x-forwarded-for"] ||
            "unknown";
          return await authenticateAdmin(
            credentials,
            String(forwarded).split(",")[0],
          );
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub || "";
      return session;
    },
  },
  logger: {
    error(code) {
      console.error("[auth]", code);
    },
    warn(code) {
      console.warn("[auth]", code);
    },
    debug() {},
  },
};
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    throw new AppError("Entre como administrador para continuar.", 401);
  await connectDB();
  const admin = await UserModel.findOne({
    _id: session.user.id,
    active: true,
    role: "ADMIN",
  })
    .select("name email")
    .lean();
  if (!admin) throw new AppError("Acesso não autorizado.", 403);
  return { id: admin._id.toString(), name: admin.name, email: admin.email };
}

export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AppError && [401, 403].includes(error.status))
      redirect("/admin/login");
    throw error;
  }
}
