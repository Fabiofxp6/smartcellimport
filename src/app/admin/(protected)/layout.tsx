import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { AppError } from "@/lib/errors";
import { AdminShell } from "@/components/admin/admin-shell";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.AUTH_SECRET || !isDatabaseConfigured())
    redirect("/admin/login");
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof AppError && [401, 403].includes(error.status))
      redirect("/admin/login");
    throw error;
  }
  return <AdminShell name={admin.name}>{children}</AdminShell>;
}
