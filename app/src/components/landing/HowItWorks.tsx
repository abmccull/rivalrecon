import React from "react";
import Link from "next/link";
import Image from "next/image";

const HowItWorks: React.FC = () => {
  const steps = [
    {
      title: "Submit Product URLs",
      description: "Simply paste competitor product URLs from major retailers or marketplaces into our dashboard.",
    },
    {
      title: "AI Analysis",
      description: "Our system automatically scrapes reviews and analyzes them using advanced AI algorithms.",
    },
    {
      title: "Get Actionable Insights",
      description: "Review detailed reports highlighting sentiment, key themes, and competitive opportunities.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <span className="text-[#2DD4BF] font-medium">HOW IT WORKS</span>
            <h2 className="text-4xl font-bold text-[#1F2937] mt-2 mb-6">Three Simple Steps to Competitor Insights</h2>

            <div className="space-y-8">
              {steps.map((step, index) => (
                <div className="flex" key={index}>
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1F2937] mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link href="#demo" className="bg-[#2DD4BF] text-white px-6 py-3 rounded-md font-medium inline-block hover:bg-opacity-90 transform hover:scale-105 transition-all cursor-pointer">
                See Demo
              </Link>
            </div>
          </div>

          {/* Detailed Report Image */}
          <div className="relative mt-10 md:mt-0">
            <div className="rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/howitworks.png"
                alt="Detailed product analysis report showing sentiment analysis, ratings trends, and key insights"
                width={650}
                height={800}
                style={{ width: '100%', height: 'auto' }}
                className="rounded-lg shadow-lg object-contain"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-[#2DD4BF] text-white p-4 rounded-lg shadow-lg hidden sm:block">
              <p className="font-bold">Average Time Saved</p>
              <p className="text-3xl font-bold">12 hrs/week</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 