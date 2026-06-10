export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">

      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 backdrop-blur-xl shadow-sm">
        <p className="text-sm text-gray-500 uppercase">
          Total Users
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          1,284
        </h2>
      </div>

      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 backdrop-blur-xl shadow-sm">
        <p className="text-sm text-gray-500 uppercase">
          Active Now
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          342
        </h2>
      </div>

      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 backdrop-blur-xl shadow-sm">
        <p className="text-sm text-gray-500 uppercase">
          Avg Session
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          42m
        </h2>
      </div>

      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 backdrop-blur-xl shadow-sm">
        <p className="text-sm text-gray-500 uppercase">
          Storage Used
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          84%
        </h2>
      </div>

    </div>
  );
}