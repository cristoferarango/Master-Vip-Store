import { requireAdminSession } from "@/lib/auth/rbac";
import { AdminSidebar } from "@/components/vip/AdminSidebar";

export default async function VipDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession("/owner");

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <AdminSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
