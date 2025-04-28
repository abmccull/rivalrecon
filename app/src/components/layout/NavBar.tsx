import React from "react";
import Link from "next/link";
import { BarChart2, Menu } from "lucide-react";

const NavBar: React.FC = () => {
  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <span className="text-[#1E3A8A] font-bold text-2xl">RivalRecon</span>
            <BarChart2 className="text-[#2DD4BF] ml-1 w-6 h-6" />
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="#features" className="text-gray-800 font-medium hover:text-[#2DD4BF] transition-colors cursor-pointer">Features</Link>
            <Link href="#solutions" className="text-gray-800 font-medium hover:text-[#2DD4BF] transition-colors cursor-pointer">Solutions</Link>
            <Link href="#pricing" className="text-gray-800 font-medium hover:text-[#2DD4BF] transition-colors cursor-pointer">Pricing</Link>
            <Link href="#resources" className="text-gray-800 font-medium hover:text-[#2DD4BF] transition-colors cursor-pointer">Resources</Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/sign-in" className="hidden md:block text-gray-800 font-medium hover:text-[#2DD4BF] transition-colors cursor-pointer">Sign in</Link>
          <Link href="/sign-up" className="bg-[#2DD4BF] text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transform hover:scale-105 transition-all cursor-pointer">
            Start Free Trial
          </Link>
          <button className="md:hidden text-gray-800">
            <Menu className="text-xl w-7 h-7" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavBar; 