import React from "react";
import Link from "next/link";
import {
  Bot, // Replaces fa-robot
  PieChart, // Replaces fa-chart-pie
  Lightbulb, // Replaces fa-lightbulb
  Eye, // Replaces fa-eye
  FileText, // Replaces fa-file-export
  Bell, // Replaces fa-bell
  ArrowRight, // Replaces fa-arrow-right
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
    <div className="w-14 h-14 bg-[#2DD4BF]/10 rounded-full flex items-center justify-center mb-6">
      <Icon className="w-7 h-7 text-[#2DD4BF]" />
    </div>
    <h3 className="text-xl font-bold text-[#1F2937] mb-3">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Features: React.FC = () => {
  const featuresData = [
    {
      icon: Bot,
      title: "Automated Review Scraping",
      description: "Automatically collect product reviews from major retailers and marketplaces to stay on top of competitor feedback.",
    },
    {
      icon: PieChart,
      title: "Sentiment Analysis",
      description: "Understand customer sentiment with AI that categorizes reviews as positive, negative, or neutral with detailed breakdowns.",
    },
    {
      icon: Lightbulb,
      title: "Key Insight Extraction",
      description: "Our AI identifies recurring themes, product issues, and competitive advantages mentioned in customer reviews.",
    },
    {
      icon: Eye,
      title: "Competitor Monitoring",
      description: "Track changes in competitor product offerings, pricing strategies, and customer sentiment over time.",
    },
    {
      icon: FileText,
      title: "Custom Reports",
      description: "Generate comprehensive reports with visualizations that can be shared with your team or exported in multiple formats.",
    },
    {
      icon: Bell,
      title: "Alert System",
      description: "Receive notifications when significant changes occur in competitor products or when sentiment shifts dramatically.",
    },
  ];

  return (
    <section id="features" className="bg-[#F7FAFC] py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[#2DD4BF] font-medium">FEATURES</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1F2937] mt-2 mb-4">How RivalRecon Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our platform combines automated data collection with AI-powered analysis to deliver actionable competitor insights.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresData.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/features" className="inline-flex items-center text-[#2DD4BF] font-medium hover:underline cursor-pointer">
            View all features
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features; 