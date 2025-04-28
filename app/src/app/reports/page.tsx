import { createClient } from '@/lib/supabase/server';
import { getRecentSubmissions } from '@/lib/dashboard';
import { redirect } from 'next/navigation';
import FullAnalysisTable from '@/components/reports/FullAnalysisTable';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default async function ReportsPage() {
  // Get Supabase client
  const supabase = await createClient();
  
  // Check if user is authenticated - using getUser() for better security
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }
  
  // Fetch all submissions from Supabase
  const submissions = await getRecentSubmissions(supabase, 100); // Get up to 100 submissions
  
  return (
    <div className="bg-[#F7FAFC] min-h-screen">
      <DashboardHeader />

      <main className="pb-16">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1F2937]">Analysis Reports</h1>
            <p className="text-gray-600 mt-2">View and manage all your product analyses</p>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <FullAnalysisTable submissions={submissions} />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-[#1E3A8A] font-bold text-lg mr-1">RivalRecon</span>
              <span className="text-[#2DD4BF]">📈</span>
              <span className="text-sm text-gray-500 ml-4">© 2025 All rights reserved</span>
            </div>
            
            <div className="flex space-x-6">
              <span className="text-sm text-gray-600 hover:text-[#2DD4BF] cursor-pointer">Help Center</span>
              <span className="text-sm text-gray-600 hover:text-[#2DD4BF] cursor-pointer">Privacy Policy</span>
              <span className="text-sm text-gray-600 hover:text-[#2DD4BF] cursor-pointer">Terms of Service</span>
              <span className="text-sm text-gray-600 hover:text-[#2DD4BF] cursor-pointer">Contact Us</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
