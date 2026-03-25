import StatsOverview from "@/components/admin/dashboard/StatsOverview";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import QuickDraft from "@/components/admin/dashboard/QuickDraft";

export const metadata = { title: "Dashboard — Admin" };

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
      <StatsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <QuickDraft />
        </div>
      </div>
    </div>
  );
}
