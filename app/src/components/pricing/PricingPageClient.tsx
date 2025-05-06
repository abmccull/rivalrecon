"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import Header from "@/components/layout/Header";
import Link from 'next/link';
import { useAuth } from '@/components/layout/AuthProvider';
import { 
  User, 
  Lock, 
  CreditCard, 
  Bell, 
  Tag, 
  BarChart, 
  Menu, 
  X, 
  ArrowLeft 
} from 'lucide-react';

// Define the sidebar tabs similar to the ones in SettingsClient
const SIDEBAR_TABS = [
  { key: "account", label: "Account", icon: User, href: "/settings" },
  { key: "security", label: "Security", icon: Lock, href: "/settings?tab=security" },
  { key: "subscription", label: "Subscription", icon: CreditCard, href: "/settings?tab=subscription" },
  { key: "notifications", label: "Notifications", icon: Bell, href: "/settings?tab=notifications" },
  { key: "pricing", label: "Pricing Plans", icon: Tag, href: "/pricing", active: true },
  { key: "dashboard", label: "Dashboard", icon: BarChart, href: "/dashboard" },
];

export default function PricingPageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <>
      <Header />
      <div className="bg-white">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar Navigation */}
          {user && (
            <div className={`w-full md:w-64 bg-gray-50 border-r border-gray-200 ${showSidebar ? 'block' : 'hidden'} md:block`}>
              <div className="sticky top-0 p-4">
                <div className="md:hidden flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Navigation</h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <nav className="space-y-1">
                  {SIDEBAR_TABS.map((tab) => (
                    <Link
                      key={tab.key}
                      href={tab.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        tab.active
                          ? 'bg-teal-100 text-teal-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {React.createElement(tab.icon, {
                        className: `mr-3 h-5 w-5 ${tab.active ? 'text-teal-500' : 'text-gray-400'}`
                      })}
                      {tab.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          )}
          
          {/* Mobile toggle button */}
          {user && (
            <div className="md:hidden fixed bottom-4 right-4 z-10">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="bg-teal-500 text-white p-3 rounded-full shadow-lg"
              >
                {showSidebar ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          )}
          
          {/* Main Content */}
          <main className={`flex-1 ${user ? 'md:pl-0' : ''}`}>
            <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                  Pricing Plans
                </h1>
                <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                  Choose the right plan for your competitor research needs
                </p>
              </div>
              
              <PricingPlans />
              
              <div className="mt-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Frequently Asked Questions
                </h2>
                <div className="mt-6 max-w-3xl mx-auto space-y-8 text-left">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">What happens after my trial ends?</h3>
                    <p className="mt-2 text-base text-gray-600">
                      After your 3-day trial period ends, your card will be automatically charged for the selected plan. You can cancel anytime before the trial ends to avoid being charged.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Can I change plans?</h3>
                    <p className="mt-2 text-base text-gray-600">
                      Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades will take effect at the end of your current billing cycle.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">How do I cancel my subscription?</h3>
                    <p className="mt-2 text-base text-gray-600">
                      You can cancel your subscription at any time from the Subscription tab in your Settings. When you cancel, you'll still have access to your plan until the end of your current billing period.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">What payment methods do you accept?</h3>
                    <p className="mt-2 text-base text-gray-600">
                      We accept all major credit cards (Visa, Mastercard, American Express), and support Apple Pay and Google Pay where available.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Back to Settings button for mobile */}
              {user && (
                <div className="mt-8 text-center">
                  <Link 
                    href="/settings" 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Settings
                  </Link>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
