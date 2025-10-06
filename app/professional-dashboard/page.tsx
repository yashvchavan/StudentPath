"use client";

export default function DashboardPage() {
  const stats = [
    { label: "Active Projects", value: 5 },
    { label: "Connections", value: 128 },
    { label: "Skills in Progress", value: 3 },
    { label: "Notifications", value: 7 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900 p-4 rounded-xl shadow hover:shadow-lg transition"
          >
            <p className="text-yellow-400 text-xl font-bold">{stat.value}</p>
            <p className="text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
