import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

const HeroSection: React.FC = () => {
  return (
    <section className="relative h-[700px] md:h-[800px] overflow-hidden">
      {/* Background Image & Gradient */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://storage.googleapis.com/uxpilot-auth.appspot.com/3869e1143a-c8b10a5f4d887ad5a2ee.png"
          alt="Modern business dashboard"
          layout="fill"
          objectFit="cover"
          className="mix-blend-overlay"
          priority // Load the hero image first
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A]/90 to-[#1E3A8A]/70"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto relative z-10 h-full flex flex-col justify-center px-6">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Uncover Competitor Insights in Minutes
          </h1>
          <div className="w-20 h-1 bg-[#2DD4BF] mb-6"></div>
          <p className="text-white text-lg md:text-xl mb-10 max-w-2xl">
            RivalRecon helps CPG brands track competitors, analyze reviews, and identify market opportunities with AI-powered insights that drive strategic decisions.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/sign-up" className="bg-[#2DD4BF] text-white px-8 py-4 rounded-md font-medium text-center hover:bg-opacity-90 transform hover:scale-105 transition-all cursor-pointer">
              Start Your 3-Day Free Trial
            </Link>
            {/* Assuming a modal or separate page for the demo video */}
            <Link href="#demo" className="border-2 border-white text-white px-8 py-4 rounded-md font-medium text-center hover:bg-white hover:text-[#1E3A8A] transition-all cursor-pointer">
              Watch Demo
            </Link>
          </div>
          <div className="mt-10 text-white text-sm flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex items-center">
              <CheckCircle className="text-[#2DD4BF] mr-2 w-4 h-4" />
              Full platform access
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center">
              <CheckCircle className="text-[#2DD4BF] mr-2 w-4 h-4" />
              Cancel anytime
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center">
              <CheckCircle className="text-[#2DD4BF] mr-2 w-4 h-4" />
              Priority support
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 