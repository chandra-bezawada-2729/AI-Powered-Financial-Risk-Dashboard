export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl shadow p-5 bg-white">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}