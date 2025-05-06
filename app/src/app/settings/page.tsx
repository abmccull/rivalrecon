import { createClient } from '@/lib/supabase/server';
import SettingsClient from "@/components/settings/SettingsClient";


// Interface for profile data
interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  job_title: string | null;
  company: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  show_email: boolean | null;
  show_phone: boolean | null;
  company_name: string | null;
  industry: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  language: string | null;
  timezone: string | null;
  notification_weekly_reports: boolean | null;
  notification_competitor_alerts: boolean | null;
  notification_product_updates: boolean | null;
  notification_marketing_emails: boolean | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export default async function SettingsPage() {
  // SSR: Create Supabase client and get authenticated user data
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return <div className="p-8 text-center">Please sign in to view your account settings.</div>;
  }
  
  // Get authenticated user data (more secure than using session directly)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return <div className="p-8 text-center">Authentication error. Please sign in again.</div>;
  }
  
  // Fetch user profile server-side
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error || !profile) {
    return <div className="p-8 text-center">Could not load profile information.</div>;
  }
  // Render the client component for settings interactivity
  return (
    <SettingsClient profile={profile} />
  );
}
