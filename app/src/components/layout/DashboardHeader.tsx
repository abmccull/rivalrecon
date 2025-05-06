'use client';

import ProfileMenu from './ProfileMenu';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DashboardHeaderProps {
  submissionId?: string;
  submissionStatus?: string;
  url?: string;
  productTitle?: string;
  asin?: string;
}

export default function DashboardHeader({ 
  submissionId, 
  submissionStatus, 
  url, 
  productTitle, 
  asin 
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleRefresh = async (refreshData: { id: string; url: string; productTitle: string; asin?: string }) => {
    const { id: originalSubmissionId, url: submissionUrl, productTitle: submissionTitle, asin: submissionAsin } = refreshData;
    
    if (isRefreshing || !submissionUrl) return; 
    setIsRefreshing(originalSubmissionId);
    
    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('submissions')
        .insert({
          url: submissionUrl, 
          user_id: user.id, 
          status: 'pending', 
          refresh_parent_id: originalSubmissionId, 
          product_title: submissionTitle, 
          asin: submissionAsin 
        });

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      toast({
        title: "Refresh Queued",
        description: `Analysis refresh added to the queue for ${submissionTitle}.`,
        variant: "default",
        className: "bg-blue-100/10 border-blue-500/20 text-[#1F2937]"
      });
      
    } catch (error) {
      console.error('Error queuing refresh:', error);
      toast({ 
        title: "Refresh Failed",
        description: `Could not add refresh to queue. ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(null); 
    }
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
          {submissionId && url && productTitle && (
            <button 
              className={`bg-[#2DD4BF] hover:bg-[#0D9488] text-white font-bold py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
              onClick={() => handleRefresh({ id: submissionId, url, productTitle, asin })}
              disabled={isRefreshing === submissionId || submissionStatus === 'pending' || submissionStatus === 'processing' || submissionStatus === 'refreshing'}
            >
              {isRefreshing === submissionId ? 'Refreshing...' : 'Refresh Analysis'}
              <span className="ml-2 text-lg">{isRefreshing === submissionId ? '⏳' : '🔄'}</span>
            </button>
          )}
          <div className="hidden md:flex items-center">
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
