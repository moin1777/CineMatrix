import Link from 'next/link';

export default function AnalyticsReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Analytics Reports</h1>
      <p className="text-gray-400">Reports route is now available and no longer returns 404.</p>
      <Link href="/admin/analytics" className="text-primary-400 hover:text-primary-300">Back to Analytics Dashboard →</Link>
    </div>
  );
}
