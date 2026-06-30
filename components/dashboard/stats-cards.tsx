type StatsCardsProps = {
  totalUsers: number;
  activeUsers: number;
  loading?: boolean;
};

export default function StatsCards({
  totalUsers,
  activeUsers,
  loading = false,
}: StatsCardsProps) {
  const displayTotalUsers = loading ? "..." : totalUsers.toLocaleString();
  const displayActiveUsers = loading ? "..." : activeUsers.toLocaleString();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-[#4648d4]/30 cursor-pointer dark:border-white/10 dark:bg-white/10">
        <p className="text-sm text-gray-500 uppercase dark:text-white/50">
          Total Users
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {displayTotalUsers}
        </h2>
      </div>

      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-[#4648d4]/30 cursor-pointer dark:border-white/10 dark:bg-white/10">
        <p className="text-sm text-gray-500 uppercase dark:text-white/50">
          Active Users
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {displayActiveUsers}
        </h2>
      </div>

      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-[#4648d4]/30 cursor-pointer dark:border-white/10 dark:bg-white/10">
        <p className="text-sm text-gray-500 uppercase dark:text-white/50">
          Avg Session
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          42m
        </h2>
      </div>

      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-[#4648d4]/30 cursor-pointer dark:border-white/10 dark:bg-white/10">
        <p className="text-sm text-gray-500 uppercase dark:text-white/50">
          Storage Used
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          84%
        </h2>
      </div>
    </div>
  );
}