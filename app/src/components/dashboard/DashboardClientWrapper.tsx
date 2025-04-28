"use client";
import dynamic from "next/dynamic";
// Import types if available (replace with your actual types or use 'any' as fallback)
// import type { SubmissionsType, MetricsType, InsightsType } from "@/lib/dashboard";

const DashboardClient = dynamic(() => import("./DashboardClient"));

export default function DashboardClientWrapper(props: {
  submissions: any;
  metrics: any;
  insights: any;
}) {
  return <DashboardClient {...props} />;
}
