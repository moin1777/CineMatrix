import Link from 'next/link';

export default function PricingPromotionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Pricing Promotions</h1>
      <p className="text-gray-400">Promotions route is now in place and no longer returns 404.</p>
      <Link href="/admin/pricing" className="text-primary-400 hover:text-primary-300">Open Pricing Engine →</Link>
    </div>
  );
}
