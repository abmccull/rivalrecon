"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthProvider';
import { useSubscription } from '@/components/layout/SubscriptionProvider';
import getStripe from '@/lib/stripe';

// Will be populated from database
type Plan = {
  id: string;
  plan_id: string;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  monthly_limit: number | null;
  is_unlimited: boolean;
  features: {
    priority: string;
    exportOptions: string[];
    historicalData: boolean;
    dashboardAccess: boolean;
    dedicatedSupport?: boolean;
  };
  recommended?: boolean;
};

// Define default plans in case we can't load from the database
const defaultPlans: Plan[] = [
  {
    id: 'c51d2f6b-f32d-44eb-8616-e1f7c4166ca7',
    plan_id: 'starter',
    name: 'Starter',
    description: 'Basic plan for small businesses',
    monthly_price: 39.99,
    yearly_price: 399.00,
    monthly_limit: 20,
    is_unlimited: false,
    features: {
      priority: 'low',
      exportOptions: ['csv'],
      historicalData: false,
      dashboardAccess: true
    }
  },
  {
    id: '88ee803e-5e5a-4ab3-91f0-aa2f3e1c61a0',
    plan_id: 'growth',
    name: 'Growth',
    description: 'Advanced features for growing businesses',
    monthly_price: 79.99,
    yearly_price: 799.00,
    monthly_limit: 50,
    is_unlimited: false,
    features: {
      priority: 'medium',
      exportOptions: ['csv', 'pdf', 'xlsx'],
      historicalData: true,
      dashboardAccess: true
    },
    recommended: true
  },
  {
    id: '44908598-da4a-4251-aeaf-39c9dd00d7f0',
    plan_id: 'scale',
    name: 'Scale',
    description: 'Enterprise-level features with unlimited analyses',
    monthly_price: 249.99,
    yearly_price: 2499.00,
    monthly_limit: null,
    is_unlimited: true,
    features: {
      priority: 'high',
      exportOptions: ['csv', 'pdf', 'xlsx', 'api'],
      historicalData: true,
      dashboardAccess: true,
      dedicatedSupport: true
    }
  }
];

export function PricingPlans() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, isSubscriptionActive } = useSubscription();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  
  // Fetch plans from database on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Use a public API endpoint to get the plans to avoid database type issues
        const response = await fetch('/api/subscription/plans');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription plans');
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Set Growth plan as recommended by default
          const plansWithRecommended = data.map(plan => ({
            id: plan.id,
            plan_id: plan.plan_id,
            name: plan.name,
            description: plan.description,
            monthly_price: plan.monthly_price,
            yearly_price: plan.yearly_price,
            monthly_limit: plan.monthly_limit,
            is_unlimited: plan.is_unlimited,
            features: plan.features,
            recommended: plan.plan_id === 'growth'
          }));
          
          setPlans(plansWithRecommended);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Keep using default plans if fetch fails
      }
    };
    
    fetchPlans();
  }, []);
  
  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      // Redirect to sign-up if not authenticated
      router.push(`/sign-up?plan=${planId}`);
      return;
    }
    
    setIsLoading(planId);
    
    try {
      // Create checkout session and get redirect URL directly from the server
      // This avoids client-side Stripe initialization issues
      const response = await fetch('/api/stripe/checkout-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId,
          billingInterval: billingInterval,
          returnUrl: window.location.origin + '/dashboard'
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.redirectUrl) {
        // Use direct window navigation instead of Stripe.js
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No redirect URL returned from checkout endpoint');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setIsLoading(null);
    }
  };
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Choose the plan that best fits your needs. All plans come with a 3-day free trial.
          </p>
        </div>
        
        <div className="flex items-center justify-center mb-8 space-x-4">
          <span className="text-sm text-gray-500">Monthly</span>
          <button
            type="button"
            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
            role="switch"
            aria-checked={billingInterval === 'yearly'}
            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                billingInterval === 'yearly' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-gray-500">Yearly <span className="text-[#2DD4BF] font-medium">(Save 17%)</span></span>
        </div>

        <div className="mt-12 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = billingInterval === 'monthly' ? plan.monthly_price : (plan.yearly_price / 12).toFixed(2);
            const formattedPrice = `$${price}`;
            const limitText = plan.is_unlimited ? 'Unlimited' : `${plan.monthly_limit}`;
            
            // Generate feature list from the plan features object
            const featureList = [
              `${limitText} product analyses per month`,
              `${plan.features.priority.charAt(0).toUpperCase() + plan.features.priority.slice(1)} priority processing`,
              `Export formats: ${plan.features.exportOptions.join(', ')}`,
              plan.features.historicalData ? 'Historical data access' : 'Basic data access',
              plan.features.dashboardAccess ? 'Dashboard analytics' : '',
              plan.features.dedicatedSupport ? 'Dedicated support' : ''
            ].filter(Boolean); // Remove empty items
            
            return (
              <div
                key={plan.id}
                className={`border rounded-lg shadow-sm divide-y divide-gray-200 bg-white ${
                  plan.recommended ? 'border-[#2DD4BF] ring-2 ring-[#2DD4BF]' : ''
                }`}
              >
                <div className="p-6">
                  {plan.recommended && (
                    <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-[#E6FFFA] text-[#0D9488]">
                      Recommended
                    </span>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900 mt-2">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <p className="mt-3">
                    <span className="text-4xl font-extrabold text-gray-900">{formattedPrice}</span>
                    <span className="text-base font-medium text-gray-500">/month</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {billingInterval === 'yearly' ? 'Billed annually' : 'Billed monthly'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.plan_id)}
                    disabled={isLoading !== null || (isSubscriptionActive() && subscription.planId === plan.plan_id)}
                    className={`mt-6 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                      isSubscriptionActive() && subscription.planId === plan.plan_id
                        ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed'
                        : 'bg-[#2DD4BF] hover:bg-[#0D9488] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2DD4BF]'
                    }`}
                  >
                    {isLoading === plan.plan_id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : isSubscriptionActive() && subscription.planId === plan.plan_id ? (
                      'Current plan'
                    ) : (
                      'Start free trial'
                    )}
                  </button>
                </div>
                <div className="py-6 px-6">
                  <h4 className="text-sm font-medium text-gray-900">What's included:</h4>
                  <ul className="mt-4 space-y-3">
                    {featureList.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
