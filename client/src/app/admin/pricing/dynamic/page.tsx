import Link from 'next/link';

export default function DynamicPricingPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Dynamic Pricing</h1>
      <p className="text-gray-400">This route is active to prevent 404 from sidebar links.</p>
      <Link href="/admin/pricing" className="text-primary-400 hover:text-primary-300">Open Pricing Engine →</Link>
    </div>
  );
}
