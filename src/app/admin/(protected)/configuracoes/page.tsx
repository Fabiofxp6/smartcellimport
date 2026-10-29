import { requireAdminPage } from "@/lib/auth";
import { getSettings } from "@/features/settings/service";
import { SettingsForm } from "@/components/admin/settings-form";
export default async function SettingsPage() {
  await requireAdminPage();
  return <SettingsForm settings={await getSettings()} />;
}
