import Link from 'next/link';

export default function AnalyticsRevenuePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
      <p className="text-gray-400">Revenue analytics route is now available.</p>
      <Link href="/admin/analytics" className="text-primary-400 hover:text-primary-300">Back to Analytics Dashboard →</Link>
    </div>
  );
}
