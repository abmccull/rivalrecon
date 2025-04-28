"use client";
import { useState } from "react";
import Header from "../layout/Header";
import Footer from "../landing/Footer";

interface SettingsClientProps {
  profile: {
    id?: string;
    user_id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    companyName?: string;
    industry?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    language?: string;
    timezone?: string;
    notification_weekly_reports?: boolean;
    notification_competitor_alerts?: boolean;
    notification_product_updates?: boolean;
    notification_marketing_emails?: boolean;
  };
}

const LANGUAGES = [
  { value: "en", label: "English (US)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

const TIMEZONES = [
  { value: "pst", label: "Pacific Time (PT)" },
  { value: "est", label: "Eastern Time (ET)" },
  { value: "cet", label: "Central European Time (CET)" },
  { value: "jst", label: "Japan Standard Time (JST)" },
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
  const [form, setForm] = useState({ ...profile });
  const [activeTab, setActiveTab] = useState("account");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle input changes
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target;
    const name = target.name;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: target.value }));
    }
  }

  function handleTabClick(tabKey: string, enabled: boolean) {
    if (enabled) setActiveTab(tabKey);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    setTimeout(() => {
      // In a real implementation, we would save to Supabase here
      setSaving(false);
      alert("Your changes have been saved successfully!");
    }, 1000);
  }

  function handleDeleteAccount() {
    setShowDeleteConfirm(false);
    alert("Account deletion request submitted. You will receive a confirmation email.");
  }

  return (
    <>
      <Header />
      
      <main id="profile-settings-main" className="min-h-screen bg-[#F7FAFC]">
        <section id="profile-header" className="bg-[#F7FAFC] py-10 border-b border-gray-200">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#1F2937] mb-2">Account Settings</h1>
                <p className="text-gray-600">Manage your profile, preferences, and subscription</p>
              </div>
              <div className="mt-4 md:mt-0">
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
        </section>

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
                      Support
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
                              <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50">
                                Change photo
                              </button>
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
                          <h3 className="text-lg font-medium text-[#1F2937] mb-3">Language & Region</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                              <select 
                                id="language" 
                                name="language" 
                                value={form.language || "en"}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                              >
                                {LANGUAGES.map(language => (
                                  <option key={language.value} value={language.value}>{language.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                              <select 
                                id="timezone" 
                                name="timezone" 
                                value={form.timezone || "pst"}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                              >
                                {TIMEZONES.map(timezone => (
                                  <option key={timezone.value} value={timezone.value}>{timezone.label}</option>
                                ))}
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
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="border-b border-gray-200 px-6 py-4">
                      <h2 className="text-xl font-bold text-[#1F2937]">Subscription Management</h2>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-500">Subscription management will be implemented in a future update.</p>
                    </div>
                  </div>
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