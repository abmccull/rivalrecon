import React from "react";
import Link from "next/link";

const FinalCTA: React.FC = () => {
  return (
    <section id="cta" className="bg-[#1E3A8A] py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Gain the Competitive Edge?
        </h2>
        <p className="text-white text-lg max-w-2xl mx-auto mb-10">
          Start uncovering competitor insights today with our 3-day free trial.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link href="/sign-up" className="bg-[#2DD4BF] text-white px-8 py-4 rounded-md font-medium text-center hover:bg-opacity-90 transform hover:scale-105 transition-all cursor-pointer">
            Start Your Free Trial
          </Link>
          <Link href="#demo" className="border-2 border-white text-white px-8 py-4 rounded-md font-medium text-center hover:bg-white hover:text-[#1E3A8A] transition-all cursor-pointer">
            Schedule a Demo
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA; 