import { PricingPlans } from '@/components/pricing/PricingPlans';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import PricingPageClient from '@/components/pricing/PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing - RivalRecon',
  description: 'Choose a plan that fits your needs for competitor product analysis',
};

export default function PricingPage() {
  // Using a client component wrapper to ensure we have access to the sidebar navigation
  return <PricingPageClient />;
}
