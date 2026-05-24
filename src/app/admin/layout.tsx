import { requireAdmin } from "@/lib/admin";
import { AdminSidebar } from "@/components/AdminSidebar";

export const metadata = { title: "PawHome Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 lg:flex">
      <AdminSidebar adminName={admin.name} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
