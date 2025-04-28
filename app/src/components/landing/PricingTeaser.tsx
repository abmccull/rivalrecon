import React from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

interface PricingCardProps {
  plan: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  ctaLink: string;
  ctaVariant?: "primary" | "secondary";
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  price,
  period = "/month",
  description,
  features,
  isPopular = false,
  ctaText,
  ctaLink,
  ctaVariant = "secondary",
}) => {
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
      <div className="flex items-end mb-6">
        <span className="text-4xl font-bold text-[#1F2937]">{price}</span>
        {period && <span className="text-gray-600 ml-1">{period}</span>}
      </div>
      <p className="text-gray-600 mb-6 h-16">{description}</p> {/* Added height for alignment */}
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
  const pricingData = [
    {
      plan: "Starter",
      price: "$99",
      description: "Perfect for small brands just getting started with competitor analysis.",
      features: [
        "10 competitor products",
        "Basic sentiment analysis",
        "Weekly reports",
        "Email support",
      ],
      ctaText: "Start Free Trial",
      ctaLink: "/sign-up?plan=starter",
      ctaVariant: "secondary" as const,
    },
    {
      plan: "Professional",
      price: "$249",
      description: "Ideal for growing brands needing deeper competitive insights.",
      features: [
        "30 competitor products",
        "Advanced sentiment analysis",
        "Daily reports & alerts",
        "Priority support",
        "Competitive benchmarking",
      ],
      isPopular: true,
      ctaText: "Start Free Trial",
      ctaLink: "/sign-up?plan=professional",
      ctaVariant: "primary" as const,
    },
    {
      plan: "Enterprise",
      price: "Custom",
      description: "For established brands with complex competitive analysis needs.",
      features: [
        "Unlimited competitor products",
        "Premium AI insights",
        "Custom reporting",
        "Dedicated account manager",
        "API access",
      ],
      ctaText: "Contact Sales",
      ctaLink: "/contact-sales",
      ctaVariant: "secondary" as const,
    },
  ];

  return (
    <section id="pricing-teaser" className="bg-white py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-[#2DD4BF] font-medium">PRICING</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1F2937] mt-2 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs, with no hidden fees or long-term commitments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingData.map((plan, index) => (
            <PricingCard key={index} {...plan} />
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