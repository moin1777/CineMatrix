import { HeroSection } from '@/components/home/hero-section';
import { NowShowingSection } from '@/components/home/now-showing-section';
import { RecommendedSection } from '@/components/home/recommended-section';
import { UpcomingSection } from '@/components/home/upcoming-section';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <div className="space-y-12 pb-16">
        <NowShowingSection />
        <RecommendedSection />
        <UpcomingSection />
      </div>
    </div>
  );
}
