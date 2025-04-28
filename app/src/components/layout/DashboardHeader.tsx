'use client';

import ProfileMenu from './ProfileMenu';
import { usePathname } from 'next/navigation';

export default function DashboardHeader() {
  const pathname = usePathname();
  
  // Determine if a path is active
  const isActive = (path: string) => {
    return pathname === path;
  };
  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <span className="text-[#1E3A8A] font-bold text-2xl">RivalRecon</span>
            <span className="text-[#2DD4BF] ml-1">📈</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a 
              href="/dashboard" 
              className={`font-medium transition-colors ${isActive('/dashboard') 
                ? 'text-[#2DD4BF] border-b-2 border-[#2DD4BF]' 
                : 'text-gray-800 hover:text-[#2DD4BF]'}`}
            >
              Dashboard
            </a>
            <a 
              href="/reports" 
              className={`font-medium transition-colors ${isActive('/reports') 
                ? 'text-[#2DD4BF] border-b-2 border-[#2DD4BF]' 
                : 'text-gray-800 hover:text-[#2DD4BF]'}`}
            >
              Reports
            </a>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-3">
            <span className="text-gray-600 text-xl cursor-pointer hover:text-[#2DD4BF]">🔔</span>
            <ProfileMenu />
          </div>
          <button className="md:hidden text-gray-800">
            <span className="text-xl">☰</span>
          </button>
        </div>
      </div>
    </header>
  );
}
