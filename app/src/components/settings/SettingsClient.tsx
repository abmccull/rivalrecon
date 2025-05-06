"use client";
import { useState, useRef, useEffect } from "react";
import Header from "../layout/Header";
import Footer from "../landing/Footer";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { SubscriptionManagement } from "../settings/subscription/SubscriptionManagement";

interface SettingsClientProps {
  profile: {
    id?: string;
    user_id?: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    company_name?: string;
    job_title?: string;
    company?: string;
    bio?: string;
    industry?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    language?: string;
    timezone?: string;
    show_email?: boolean;
    show_phone?: boolean;
    notification_weekly_reports?: boolean;
    notification_competitor_alerts?: boolean;
    notification_product_updates?: boolean;
    notification_marketing_emails?: boolean;
    created_at?: string;
    updated_at?: string;
  };
}

const TIMEZONES = [
  // North America
  { value: "america/los_angeles", label: "Pacific Time (PT) - Los Angeles" },
  { value: "america/denver", label: "Mountain Time (MT) - Denver" },
  { value: "america/chicago", label: "Central Time (CT) - Chicago" },
  { value: "america/new_york", label: "Eastern Time (ET) - New York" },
  { value: "america/anchorage", label: "Alaska Time - Anchorage" },
  { value: "america/halifax", label: "Atlantic Time - Halifax" },
  { value: "america/st_johns", label: "Newfoundland Time - St. John's" },
  
  // Europe & Africa
  { value: "europe/london", label: "Greenwich Mean Time (GMT) - London" },
  { value: "europe/berlin", label: "Central European Time (CET) - Berlin" },
  { value: "europe/helsinki", label: "Eastern European Time (EET) - Helsinki" },
  { value: "europe/moscow", label: "Moscow Time (MSK) - Moscow" },
  { value: "africa/cairo", label: "Eastern European Time (EET) - Cairo" },
  { value: "africa/johannesburg", label: "South Africa Standard Time (SAST) - Johannesburg" },
  
  // Asia & Australia
  { value: "asia/dubai", label: "Gulf Standard Time (GST) - Dubai" },
  { value: "asia/kolkata", label: "India Standard Time (IST) - Mumbai" },
  { value: "asia/bangkok", label: "Indochina Time (ICT) - Bangkok" },
  { value: "asia/shanghai", label: "China Standard Time (CST) - Shanghai" },
  { value: "asia/tokyo", label: "Japan Standard Time (JST) - Tokyo" },
  { value: "australia/sydney", label: "Australian Eastern Time (AET) - Sydney" },
  { value: "pacific/auckland", label: "New Zealand Standard Time (NZST) - Auckland" },
];

const INDUSTRIES = [
  { value: "food", label: "Food & Beverage" },
  { value: "health", label: "Health & Wellness" },
  { value: "beauty", label: "Beauty & Personal Care" },
  { value: "household", label: "Household Products" },
  { value: "other", label: "Other" },
];

const SIDEBAR_TABS = [
  { key: "account", label: "Account", icon: "fa-user", enabled: true },
  { key: "security", label: "Security", icon: "fa-lock", enabled: true },
  { key: "subscription", label: "Subscription", icon: "fa-credit-card", enabled: true },
  { key: "notifications", label: "Notifications", icon: "fa-bell", enabled: true },
  { key: "api", label: "API Access", icon: "fa-code", enabled: false },
  { key: "team", label: "Team Members", icon: "fa-users", enabled: false },
];

export default function SettingsClient({ profile }: SettingsClientProps) {
  const [isClient, setIsClient] = useState(false);
  
  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Convert snake_case database field names to camelCase for the form
  const initialFormState = {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    displayName: profile.display_name,
    email: profile.email,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
    companyName: profile.company_name,
    jobTitle: profile.job_title,
    company: profile.company,
    bio: profile.bio,
    industry: profile.industry,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    zip: profile.zip,
    timezone: profile.timezone,
    showEmail: profile.show_email,
    showPhone: profile.show_phone,
    notification_weekly_reports: profile.notification_weekly_reports,
    notification_competitor_alerts: profile.notification_competitor_alerts,
    notification_product_updates: profile.notification_product_updates,
    notification_marketing_emails: profile.notification_marketing_emails,
  };
  
  const [form, setForm] = useState(initialFormState);
  const [activeTab, setActiveTab] = useState("account");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  // Create a ref for the file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // Handle input changes
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target;
    const name = target.name;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: target.checked }));
    } else if (target instanceof HTMLInputElement && target.type === "file") {
      // Handle file uploads separately
      handleFileUpload(target.files?.[0]);
    } else {
      setForm((prev) => ({ ...prev, [name]: target.value }));
    }
  }

  function handleTabClick(tabKey: string, enabled: boolean) {
    if (enabled) setActiveTab(tabKey);
  }
  
  // Handle file upload
  async function handleFileUpload(file?: File) {
    if (!file) return;
    
    try {
      setUploading(true);
      
      // Create Supabase client
      const supabase = createClient();
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      
      // Get public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      // Update the form state with the new avatar URL
      setForm(prev => ({
        ...prev,
        avatarUrl: data.publicUrl,
      }));
      
      toast({
        title: "Success",
        description: "Profile picture uploaded successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to upload profile picture',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Prepare the data to send to the API
      const profileData = {
        ...form,
        id: profile.id, // Ensure the ID is included
      };
      
      // Send the data to the profile API endpoint
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile changes');
      }
      
      toast({
        title: "Success",
        description: "Your changes have been saved successfully!",
        variant: "default",
      });
      
      // Refresh the page after a short delay to update the header with new profile data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save changes',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteAccount() {
    setShowDeleteConfirm(false);
    toast({
      title: "Account Deletion Requested",
      description: "You will receive a confirmation email shortly.",
      variant: "destructive",
    });
  }

  return (
    <>
      <Header />
      
      {/* Sticky Save Changes Button */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#1F2937]">Account Settings</h1>
            <button 
              className="bg-[#2DD4BF] text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transform hover:scale-105 transition-all"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
      
      <main id="profile-settings-main" className="min-h-screen bg-[#F7FAFC]">
        <section id="profile-content" className="py-8">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Navigation */}
              <div id="profile-sidebar" className="w-full lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <nav>
                    <ul>
                      {SIDEBAR_TABS.map((tab) => (
                        <li key={tab.key}>
                          <span
                            className={`flex items-center px-4 py-3 border-l-4 ${activeTab === tab.key ? "border-[#2DD4BF] bg-[#ECFDF5] text-[#2DD4BF]" : "border-transparent hover:bg-gray-50"} ${!tab.enabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            onClick={() => handleTabClick(tab.key, tab.enabled)}
                          >
                            {tab.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>

                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#1E3A8A] rounded-full flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-[#1F2937]">Need help?</h3>
                      <p className="text-sm text-gray-600">Contact support</p>
                    </div>
                  </div>
                  <button className="mt-3 w-full border border-gray-300 rounded-md py-2 px-4 text-gray-700 hover:bg-gray-50 text-sm font-medium">
                    Contact Support
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div id="profile-main-content" className="flex-1">
                {activeTab === "account" && (
                  <>
                    {/* Account Section - Personal Information */}
                    <div id="account-section" className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                        <div className="border-b border-gray-200 px-6 py-4">
                          <h2 className="text-xl font-bold text-[#1F2937]">Personal Information</h2>
                        </div>
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center mb-8">
                          <div className="mb-4 md:mb-0 md:mr-6">
                            {form.avatarUrl ? (
                              <img 
                                src={form.avatarUrl} 
                                alt="Profile" 
                                className="w-20 h-20 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-[#1E3A8A] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {form.firstName?.[0] || "?"}
                                {form.lastName?.[0] || ""}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-[#1F2937] mb-1">Profile Photo</h3>
                            <p className="text-gray-600 text-sm mb-3">This will be displayed on your profile</p>
                            <div className="flex space-x-3">
                              <button 
                                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                              >
                                {uploading ? "Uploading..." : "Change photo"}
                              </button>
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                              />
                              <button 
                                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50"
                                onClick={() => setForm(prev => ({ ...prev, avatarUrl: undefined }))}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input 
                              type="text" 
                              id="firstName" 
                              name="firstName" 
                              value={form.firstName || ""} 
                              onChange={handleChange} 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input 
                              type="text" 
                              id="lastName" 
                              name="lastName" 
                              value={form.lastName || ""} 
                              onChange={handleChange} 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input 
                              type="email" 
                              id="email" 
                              name="email" 
                              value={form.email || ""} 
                              onChange={handleChange} 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input 
                              type="tel" 
                              id="phone" 
                              name="phone" 
                              value={form.phone || ""} 
                              onChange={handleChange} 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company Information */}
                    <div id="company-section" className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                      <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-bold text-[#1F2937]">Company Information</h2>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input 
                              type="text" 
                              id="companyName" 
                              name="companyName" 
                              value={form.companyName || ""} 
                              onChange={handleChange} 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                            <select 
                              id="industry" 
                              name="industry" 
                              value={form.industry || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                            >
                              <option value="">Select Industry</option>
                              {INDUSTRIES.map(industry => (
                                <option key={industry.value} value={industry.value}>{industry.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                            <input 
                              type="text" 
                              id="address" 
                              name="address" 
                              value={form.address || ""} 
                              onChange={handleChange} 
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent mb-3"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input 
                                type="text" 
                                id="city" 
                                name="city" 
                                placeholder="City" 
                                value={form.city || ""} 
                                onChange={handleChange} 
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                              />
                              <input 
                                type="text" 
                                id="state" 
                                name="state" 
                                placeholder="State" 
                                value={form.state || ""} 
                                onChange={handleChange} 
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                              />
                              <input 
                                type="text" 
                                id="zip" 
                                name="zip" 
                                placeholder="Zip Code" 
                                value={form.zip || ""} 
                                onChange={handleChange} 
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div id="preferences-section" className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                      <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-bold text-[#1F2937]">Preferences</h2>
                      </div>
                      <div className="p-6">
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-[#1F2937] mb-3">Region</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                              <select 
                                id="timezone" 
                                name="timezone" 
                                value={form.timezone || ""}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                              >
                                <option value="">Select Timezone</option>
                                <optgroup label="North America">
                                  {TIMEZONES.slice(0, 7).map(timezone => (
                                    <option key={timezone.value} value={timezone.value}>{timezone.label}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Europe & Africa">
                                  {TIMEZONES.slice(7, 13).map(timezone => (
                                    <option key={timezone.value} value={timezone.value}>{timezone.label}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Asia & Australia">
                                  {TIMEZONES.slice(13).map(timezone => (
                                    <option key={timezone.value} value={timezone.value}>{timezone.label}</option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-[#1F2937] mb-3">Email Notifications</h3>
                          <div className="space-y-4">
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input 
                                  id="notification_weekly_reports" 
                                  name="notification_weekly_reports" 
                                  type="checkbox" 
                                  checked={!!form.notification_weekly_reports} 
                                  onChange={handleChange} 
                                  className="h-4 w-4 text-[#2DD4BF] focus:ring-[#2DD4BF] rounded"
                                />
                              </div>
                              <div className="ml-3">
                                <label htmlFor="notification_weekly_reports" className="font-medium text-gray-700">Weekly Reports</label>
                                <p className="text-gray-500 text-sm">Receive a summary of your competitor analysis every week</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input 
                                  id="notification_competitor_alerts" 
                                  name="notification_competitor_alerts" 
                                  type="checkbox" 
                                  checked={!!form.notification_competitor_alerts} 
                                  onChange={handleChange} 
                                  className="h-4 w-4 text-[#2DD4BF] focus:ring-[#2DD4BF] rounded"
                                />
                              </div>
                              <div className="ml-3">
                                <label htmlFor="notification_competitor_alerts" className="font-medium text-gray-700">Competitor Alerts</label>
                                <p className="text-gray-500 text-sm">Get notified when significant changes occur in competitor products</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input 
                                  id="notification_product_updates" 
                                  name="notification_product_updates" 
                                  type="checkbox" 
                                  checked={!!form.notification_product_updates} 
                                  onChange={handleChange} 
                                  className="h-4 w-4 text-[#2DD4BF] focus:ring-[#2DD4BF] rounded"
                                />
                              </div>
                              <div className="ml-3">
                                <label htmlFor="notification_product_updates" className="font-medium text-gray-700">Product Updates</label>
                                <p className="text-gray-500 text-sm">Stay informed about new features and improvements</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input 
                                  id="notification_marketing_emails" 
                                  name="notification_marketing_emails" 
                                  type="checkbox" 
                                  checked={!!form.notification_marketing_emails} 
                                  onChange={handleChange} 
                                  className="h-4 w-4 text-[#2DD4BF] focus:ring-[#2DD4BF] rounded"
                                />
                              </div>
                              <div className="ml-3">
                                <label htmlFor="notification_marketing_emails" className="font-medium text-gray-700">Marketing Emails</label>
                                <p className="text-gray-500 text-sm">Receive promotional offers and marketing communications</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div id="danger-zone" className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="border-b border-gray-200 px-6 py-4 bg-red-50">
                        <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
                      </div>
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-[#1F2937] mb-1">Delete Account</h3>
                            <p className="text-gray-600 text-sm">Permanently delete your account and all associated data</p>
                          </div>
                          <button 
                            className="mt-4 md:mt-0 bg-white border border-red-500 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50"
                            onClick={() => setShowDeleteConfirm(true)}
                          >
                            Delete Account
                          </button>
                        </div>
                        
                        {showDeleteConfirm && (
                          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-red-700 font-medium mb-3">Are you sure you want to delete your account? This action cannot be undone.</p>
                            <div className="flex space-x-3">
                              <button 
                                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                                onClick={handleDeleteAccount}
                              >
                                Yes, Delete Account
                              </button>
                              <button 
                                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
                                onClick={() => setShowDeleteConfirm(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                {activeTab === "security" && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="border-b border-gray-200 px-6 py-4">
                      <h2 className="text-xl font-bold text-[#1F2937]">Security Settings</h2>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-500">Security settings will be implemented in a future update.</p>
                    </div>
                  </div>
                )}
                
                {activeTab === "subscription" && (
                  <SubscriptionManagement />
                )}

                {activeTab === "notifications" && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="border-b border-gray-200 px-6 py-4">
                      <h2 className="text-xl font-bold text-[#1F2937]">Notification Preferences</h2>
                    </div>
                    <div className="p-6">
                      <div>
                        <h3 className="text-lg font-medium text-[#1F2937] mb-3">Email Notifications</h3>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input 
                                id="notification_weekly_reports" 
                                name="notification_weekly_reports" 
                                type="checkbox" 
                                checked={!!form.notification_weekly_reports} 
                                onChange={handleChange} 
                                className="h-4 w-4 text-[#2DD4BF] focus:ring-[#2DD4BF] rounded"
                              />
                            </div>
                            <div className="ml-3">
                              <h4 className="font-medium">Weekly Reports</h4>
                              <p className="text-gray-600 text-sm">Receive a summary of your competitor analysis every week</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input 
                                id="notification_competitor_alerts" 
                                name="notification_competitor_alerts" 
                                type="checkbox" 
                                checked={!!form.notification_competitor_alerts} 
                                onChange={handleChange} 
                                className="h-4 w-4 text-[#2DD4BF] focus:ring-[#2DD4BF] rounded"
                              />
                            </div>
                            <div className="ml-3">
                              <h4 className="font-medium">Competitor Alerts</h4>
                              <p className="text-gray-600 text-sm">Get notified when significant changes occur in competitor products</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input 
                                id="notification_product_updates" 
                                name="notification_product_updates" 
                                type="checkbox" 
                                checked={!!form.notification_product_updates} 
                                onChange={handleChange} 
                                className="h-4 w-4 text-[#2DD4BF] focus:ring-[#2DD4BF] rounded"
                              />
                            </div>
                            <div className="ml-3">
                              <h4 className="font-medium">Product Updates</h4>
                              <p className="text-gray-600 text-sm">Stay informed about new features and improvements</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input 
                                id="notification_marketing_emails" 
                                name="notification_marketing_emails" 
                                type="checkbox" 
                                checked={!!form.notification_marketing_emails} 
                                onChange={handleChange} 
                                className="h-4 w-4 text-[#2DD4BF] focus:ring-[#2DD4BF] rounded"
                              />
                              </div>
                              <div className="ml-3">
                                <label htmlFor="notification_marketing_emails" className="font-medium text-gray-700">Marketing Emails</label>
                                <p className="text-gray-500 text-sm">Receive promotional offers and marketing communications</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }