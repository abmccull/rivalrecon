import React from "react";
import { Store, Factory, Package, Cookie, Globe } from "lucide-react"; // Using Lucide placeholders

const TrustedBy: React.FC = () => {
  const iconStyle = "w-10 h-10 text-gray-700"; // Adjusted size for Lucide
  const wrapperStyle =
    "grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100";

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-6">
        <p className="text-center text-gray-500 font-medium mb-8">
          TRUSTED BY LEADING CPG BRANDS
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {/* Placeholder Icons */}
          <div className={wrapperStyle}>
            <Store className={iconStyle} aria-label="Placeholder Brand 1" />
          </div>
          <div className={wrapperStyle}>
            <Factory className={iconStyle} aria-label="Placeholder Brand 2" />
          </div>
          <div className={wrapperStyle}>
            <Package className={iconStyle} aria-label="Placeholder Brand 3" />
          </div>
          <div className={wrapperStyle}>
            <Cookie className={iconStyle} aria-label="Placeholder Brand 4" />
          </div>
          <div className={wrapperStyle}>
            <Globe className={iconStyle} aria-label="Placeholder Brand 5" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy; 