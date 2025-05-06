"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PricingCardProps {
  plan: string;
  monthlyPrice: number;
  annualPrice: number;
  isAnnual: boolean;
  description: string;
  features: string[];
  limit: string;
  isPopular?: boolean;
  ctaText: string;
  ctaLink: string;
  ctaVariant?: "primary" | "secondary";
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  monthlyPrice,
  annualPrice,
  isAnnual,
  description,
  features,
  limit,
  isPopular = false,
  ctaText,
  ctaLink,
  ctaVariant = "secondary",
}) => {
  // Calculate displayed price based on billing frequency
  const displayPrice = isAnnual ? annualPrice : monthlyPrice;
  const period = isAnnual ? "/year" : "/month";
  
  // Calculate savings for annual plan (if applicable)
  const annualSavings = isAnnual ? Math.round((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12) * 100) : 0;
  const cardBaseStyle = "rounded-lg shadow-md p-8 transition-shadow border";
  const cardHoverStyle = isPopular ? "hover:shadow-2xl hover:scale-105 duration-300" : "hover:shadow-lg";
  const cardBorderStyle = isPopular ? "border-2 border-[#2DD4BF]" : "border-gray-200";
  const cardBgStyle = isPopular ? "bg-white" : "bg-[#F7FAFC]";

  const ctaBaseStyle = "block text-center px-6 py-3 rounded-md font-medium transition-colors cursor-pointer";
  const ctaPrimaryStyle = "bg-[#2DD4BF] text-white hover:bg-opacity-90";
  const ctaSecondaryStyle = "border-2 border-[#2DD4BF] text-[#2DD4BF] hover:bg-[#2DD4BF] hover:text-white";

  return (
    <div className={`${cardBaseStyle} ${cardHoverStyle} ${cardBorderStyle} ${cardBgStyle} relative ${isPopular ? 'transform' : ''}`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-[#2DD4BF] text-white text-sm font-bold px-4 py-1 rounded-bl-lg rounded-tr-lg">
          MOST POPULAR
        </div>
      )}
      <h3 className="text-xl font-bold text-[#1F2937] mb-2">{plan}</h3>
      <div className="flex items-end mb-2">
        <span className="text-4xl font-bold text-[#1F2937]">${displayPrice.toFixed(2)}</span>
        <span className="text-gray-600 ml-1">{period}</span>
      </div>
      {isAnnual && annualSavings > 0 && (
        <div className="text-[#2DD4BF] text-sm font-medium mb-4">
          Save {annualSavings}% with annual billing
        </div>
      )}
      <p className="text-gray-600 mb-3">{description}</p>
      <div className="bg-gray-100 rounded-md py-2 px-3 text-center mb-6">
        <span className="font-medium">{limit}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li className="flex items-start" key={index}>
            <Check className="w-4 h-4 text-[#2DD4BF] mt-1 mr-2 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <Link href={ctaLink} className={`${ctaBaseStyle} ${ctaVariant === 'primary' ? ctaPrimaryStyle : ctaSecondaryStyle}`}>
        {ctaText}
      </Link>
    </div>
  );
};

const PricingTeaser: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  
  const pricingData = [
    {
      plan: "Starter",
      monthlyPrice: 39.99,
      annualPrice: 399,
      description: "Perfect for small brands just getting started with competitor analysis.",
      limit: "20 analyses per month",
      features: [
        "Up to 5 competitor products",
        "Basic sentiment analysis",
        "Export to CSV",
        "Email support",
      ],
      ctaText: "Start Free Trial",
      ctaLink: "/sign-up?plan=starter",
      ctaVariant: "secondary" as const,
    },
    {
      plan: "Growth",
      monthlyPrice: 79.99,
      annualPrice: 799,
      description: "Ideal for growing brands needing deeper competitive insights.",
      limit: "50 analyses per month",
      features: [
        "Up to 15 competitor products",
        "Advanced sentiment analysis",
        "Historical data access",
        "Priority support",
        "Export to CSV, PDF, Excel",
      ],
      isPopular: true,
      ctaText: "Start Free Trial",
      ctaLink: "/sign-up?plan=growth",
      ctaVariant: "primary" as const,
    },
    {
      plan: "Scale",
      monthlyPrice: 249.99,
      annualPrice: 2499,
      description: "For established brands with complex competitive analysis needs.",
      limit: "Unlimited analyses",
      features: [
        "Unlimited competitor products",
        "Premium AI insights",
        "Historical & real-time data",
        "Dedicated account manager",
        "API access",
      ],
      ctaText: "Start Free Trial",
      ctaLink: "/sign-up?plan=scale",
      ctaVariant: "secondary" as const,
    },
  ];

  return (
    <section id="pricing-teaser" className="bg-white py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <span className="text-[#2DD4BF] font-medium">PRICING</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1F2937] mt-2 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Choose the plan that fits your needs, with no hidden fees or long-term commitments.
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-[#1F2937]' : 'text-gray-500'}`}>Monthly</span>
            <Switch 
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-[#2DD4BF]"
            />
            <div className="flex items-center">
              <span className={`text-sm font-medium ${isAnnual ? 'text-[#1F2937]' : 'text-gray-500'}`}>Annual</span>
              <span className="ml-2 bg-[#2DD4BF] text-white text-xs py-1 px-2 rounded-full">
                Get 2 months free
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingData.map((plan, index) => (
            <PricingCard 
              key={index} 
              {...plan} 
              isAnnual={isAnnual} 
            />
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm mb-4">
            All plans include a 3-day free trial.
          </p>
          <Link href="/pricing" className="inline-flex items-center text-[#2DD4BF] font-medium hover:underline cursor-pointer">
            View full pricing details
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PricingTeaser; 