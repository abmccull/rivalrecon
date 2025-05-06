"use client";

import FullAnalysisTable from '@/components/reports/FullAnalysisTable';
import ReportsSubscriptionGuard from '@/components/reports/ReportsSubscriptionGuard';

interface ReportsContentProps {
  submissions: any[];
}

/**
 * Client component that wraps reports content with subscription validation
 */
export default function ReportsContent({ submissions }: ReportsContentProps) {
  return (
    <ReportsSubscriptionGuard>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <FullAnalysisTable submissions={submissions} />
      </div>
    </ReportsSubscriptionGuard>
  );
}
