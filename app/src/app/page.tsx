import AnnouncementBar from "@/components/landing/AnnouncementBar";
import NavBar from "@/components/layout/NavBar";
import HeroSection from "@/components/landing/HeroSection";
import TrustedBy from "@/components/landing/TrustedBy";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import PricingTeaser from "@/components/landing/PricingTeaser";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

// This special export tells Next.js that this page shouldn't use the default layout
// This prevents the Header component in the root layout from rendering on this page
export const metadata = {
  title: 'RivalRecon - Competitive Intelligence Platform',
  description: 'Analyze product reviews and gather competitive intelligence for CPG companies',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar />
      <NavBar />
      <main className="flex-1">
        <HeroSection />
        <TrustedBy />
        <Features />
        <HowItWorks />
        <Testimonials />
        <PricingTeaser />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
