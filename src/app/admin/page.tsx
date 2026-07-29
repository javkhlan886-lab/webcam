import { ResolveReportForm } from "@/components/admin/resolve-report-form";
import { UserBanToggle } from "@/components/admin/user-ban-toggle";
import { listReports, listUsers } from "@/lib/queries/admin";
import { requireRole } from "@/lib/session";

export default async function AdminPanel() {
  await requireRole("admin");
  const [users, reports] = await Promise.all([
    listUsers(),
    listReports("pending"),
  ]);

  return (
    <div className="min-h-screen flex-1 bg-gray-900 p-8">
      <h1 className="mb-8 text-3xl font-bold text-white">Admin Panel</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">
            Users ({users.length})
          </h2>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded bg-gray-700 p-3"
              >
                <div>
                  <p className="font-bold text-white">{u.username}</p>
                  <p className="text-sm text-gray-400">
                    {u.email} &middot; {u.role}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!u.isActive && (
                    <span className="text-sm font-bold text-red-500">
                      Banned
                    </span>
                  )}
                  <UserBanToggle userId={u.id} isActive={u.isActive} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">
            Pending Reports ({reports.length})
          </h2>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {reports.length === 0 && (
              <p className="text-gray-400">No pending reports.</p>
            )}
            {reports.map((r) => (
              <div key={r.id} className="rounded bg-gray-700 p-3">
                <p className="font-bold text-white">{r.reporterName}</p>
                <p className="text-sm text-gray-400">{r.reason}</p>
                {r.description && (
                  <p className="mt-1 text-sm text-gray-300">{r.description}</p>
                )}
                <ResolveReportForm reportId={r.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
