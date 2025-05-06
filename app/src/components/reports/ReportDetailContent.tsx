"use client";

import { ReactNode } from 'react';
import ReportDetailGuard from './ReportDetailGuard';

interface ReportDetailContentProps {
  children: ReactNode;
  reportId: string;
}

/**
 * Client component that wraps report detail content with subscription guard
 */
export default function ReportDetailContent({ 
  children,
  reportId 
}: ReportDetailContentProps) {
  return (
    <ReportDetailGuard reportId={reportId}>
      {children}
    </ReportDetailGuard>
  );
}
