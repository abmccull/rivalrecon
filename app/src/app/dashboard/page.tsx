import { createClient } from '@/lib/supabase/server';
import { getRecentSubmissions, getDashboardMetrics, getRecentInsights, getMonthlyUsage } from '@/lib/dashboard';
import { redirect } from 'next/navigation';

// Import client components
import SubmissionForm from '@/components/dashboard/SubmissionForm';
import BulkUpload from '@/components/dashboard/BulkUpload';
import AnalysisHistory from '@/components/dashboard/AnalysisHistory';
import QuickStats from '@/components/dashboard/QuickStats';
import RecentInsights from '@/components/dashboard/RecentInsights';
import DashboardHeader from '@/components/layout/DashboardHeader';
import UsageCounter from '@/components/dashboard/UsageCounter';

export default async function DashboardPage() {
  // Get Supabase client
  const supabase = await createClient();
  
  // Check if user is authenticated - using getUser() for better security
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }
  
  // Fetch real data from Supabase
  const submissionsResponse = await getRecentSubmissions();
  const metricsResponse = await getDashboardMetrics();
  const usageResponse = await getMonthlyUsage();
  
  // Ensure responses are properly typed and handle errors
  const submissions = Array.isArray(submissionsResponse) ? submissionsResponse : [];
  const metrics = typeof metricsResponse === 'object' && metricsResponse !== null ? metricsResponse : {
    totalSubmissions: 0,
    pendingSubmissions: 0,
    completedSubmissions: 0,
    totalCompetitorsTracked: 0,
    totalReviewsAnalyzed: 0
  };
  
  // Ensure insights is always an array before passing to components
  const insightsResponse = await getRecentInsights();
  const insights = Array.isArray(insightsResponse) ? insightsResponse : [];
  
  // Error handling without console logging
  // Silently handle error responses without logging to console
  
  // Process usage data
  const usageData = typeof usageResponse === 'object' && usageResponse !== null
    ? usageResponse
    : { 
        used: 0, 
        limit: 20, 
        renewalDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
        isUnlimited: false 
      };
  
  return (
    <div className="bg-[#F7FAFC] min-h-screen">
      <DashboardHeader />

      <main className="pb-16">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1F2937]">Competitor Analysis Dashboard</h1>
            <p className="text-gray-600 mt-2">Submit product URLs for analysis and review your submission history</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - URL Submission Form */}
            <div className="lg:col-span-1">
              <SubmissionForm />
              <BulkUpload />
            </div>
            
            {/* Right Column - Analysis History & Quick Stats */}
            <div className="lg:col-span-2">
              {/* Monthly Usage Counter */}
              <div className="mb-6">
                <UsageCounter 
                  used={usageData.used} 
                  limit={usageData.limit} 
                  renewalDate={usageData.renewalDate}
                  isUnlimited={usageData.isUnlimited} 
                />
              </div>
              
              <div className="mb-10">
                <AnalysisHistory submissions={submissions} />
              </div>
              
              <div className="mb-10">
                <QuickStats metrics={metrics} />
              </div>
              
              <div className="mb-6">
                <RecentInsights insights={insights} />
              </div>
            </div>
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
