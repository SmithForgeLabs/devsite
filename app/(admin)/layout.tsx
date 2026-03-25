import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminTopBar from "@/components/admin/layout/AdminTopBar";
import AuthInitializer from "@/components/admin/AuthInitializer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // User info is injected by middleware (already verified & possibly refreshed)
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const userRole = headersList.get("x-user-role");

  if (!userId || !userRole) {
    redirect("/login?from=/admin");
  }

  return (
    <div className="flex min-h-screen bg-[#F7F7FA]">
      <AuthInitializer />
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
