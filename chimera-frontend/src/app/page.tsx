'use client';

import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FeaturedAgents } from '@/components/home/FeaturedAgents';
import { HomeMissionFeed } from '@/components/home/HomeMissionFeed';
import { ComposeCTA } from '@/components/home/ComposeCTA';
import { FranchiseTeaser } from '@/components/home/FranchiseTeaser';
import { HomeFooter } from '@/components/home/HomeFooter';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <HeroSection />
      <HowItWorks />
      <FeaturedAgents />
      <HomeMissionFeed />
      <ComposeCTA />
      <FranchiseTeaser />
      <HomeFooter />
    </main>
  );
}
