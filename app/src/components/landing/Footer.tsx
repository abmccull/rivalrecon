import React from "react";
import Link from "next/link";
import { BarChart2, Twitter, Linkedin, Facebook, Instagram } from "lucide-react"; // Using Lucide placeholders

const Footer: React.FC = () => {
  const socialIconStyle = "w-5 h-5"; // Adjusted size
  const linkStyle = "text-gray-600 hover:text-[#2DD4BF] cursor-pointer";
  const socialLinkStyle = "text-gray-500 hover:text-[#2DD4BF] cursor-pointer";

  return (
    <footer className="bg-[#F7FAFC] pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Logo and Social */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-[#1E3A8A] font-bold text-2xl">RivalRecon</span>
              <BarChart2 className="text-[#2DD4BF] ml-1 w-6 h-6" />
            </div>
            <p className="text-gray-600 mb-6">
              Helping CPG brands make data-driven decisions with AI-powered competitor insights.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className={socialLinkStyle} aria-label="Twitter">
                <Twitter className={socialIconStyle} />
              </Link>
              <Link href="#" className={socialLinkStyle} aria-label="LinkedIn">
                <Linkedin className={socialIconStyle} />
              </Link>
              <Link href="#" className={socialLinkStyle} aria-label="Facebook">
                <Facebook className={socialIconStyle} />
              </Link>
              <Link href="#" className={socialLinkStyle} aria-label="Instagram">
                <Instagram className={socialIconStyle} />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-[#1F2937] mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className={linkStyle}>Features</Link></li>
              <li><Link href="/pricing" className={linkStyle}>Pricing</Link></li>
              <li><Link href="/api-docs" className={linkStyle}>API</Link></li>
              <li><Link href="/integrations" className={linkStyle}>Integrations</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold text-[#1F2937] mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/blog" className={linkStyle}>Blog</Link></li>
              <li><Link href="/case-studies" className={linkStyle}>Case Studies</Link></li>
              <li><Link href="/webinars" className={linkStyle}>Webinars</Link></li>
              <li><Link href="/help" className={linkStyle}>Help Center</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-[#1F2937] mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className={linkStyle}>About Us</Link></li>
              <li><Link href="/careers" className={linkStyle}>Careers</Link></li>
              <li><Link href="/contact" className={linkStyle}>Contact Us</Link></li>
              <li><Link href="/privacy" className={linkStyle}>Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">© {new Date().getFullYear()} RivalRecon. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/terms" className={`${linkStyle} text-sm`}>Terms of Service</Link>
            <Link href="/privacy" className={`${linkStyle} text-sm`}>Privacy Policy</Link>
            <Link href="/cookies" className={`${linkStyle} text-sm`}>Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 