"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@/lib/supabase/custom-types';

export default function SubmissionForm() {
  const [productUrl, setProductUrl] = useState('');
  const [isCompetitor, setIsCompetitor] = useState(true);
  const [recurring, setRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('weekly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);
    
    try {
      // Validate form
      if (!productUrl) {
        throw new Error('Please enter a product URL');
      }
      
      // Create Supabase client
      const supabase = createClient();
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to submit an analysis');
      }
      
      // Extract product name and other info from URL
      // This is a simplified approach - in a real implementation, you might want to
      // fetch the page and extract more accurate information
      const url = new URL(productUrl);
      const pathSegments = url.pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];
      const productTitle = lastSegment.replace(/-|_/g, ' ').trim() || 'Product from ' + url.hostname;
      
      // Create submission record
      const { data, error: submissionError } = await supabase
        .from('submissions')
        .insert([
          {
            user_id: session.user.id,
            url: productUrl, // Fixed field name to match database schema
            product_title: productTitle,
            brand_name: url.hostname.replace('www.', ''),
            category_name: 'auto-detected',
            is_competitor_product: isCompetitor,
            status: 'pending'
          }
        ])
        .select();
      
      if (submissionError) throw new Error(submissionError.message);
      
      // Increment the submission counter using the dedicated Supabase function
      try {
        console.log('Incrementing submission counter for user:', session.user.id);
        
        // Direct call to the RPC function we've created in Supabase
        // Cast to our custom SupabaseClient type to enable proper type checking
        const customClient = supabase as unknown as SupabaseClient;
        const { error: counterError } = await customClient.rpc(
          'increment_submission_counter', // Function name as it exists in Supabase
          { user_id_param: session.user.id }
        );
        
        if (counterError) {
          console.error('Error incrementing submission counter:', counterError);
        } else {
          console.log('Successfully incremented submission counter');
        }
      } catch (err) {
        console.error('Exception in counter increment:', err);
        // Continue with the submission process even if counter update fails
      }
      
      // If recurring is enabled, create recurring analysis record
      if (recurring && data && data[0]) {
        // Properly type the recurring analysis record with all required fields
        const recurringData = {
          user_id: session.user.id,
          submission_id: data[0].id,
          interval: recurringFrequency, // Use interval instead of frequency to match the schema
          next_run: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(), // Set default next run to tomorrow
          status: 'scheduled'
        };
        
        const { error: recurringError } = await supabase
          .from('recurring_analyses')
          .insert([recurringData]);
        
        if (recurringError) console.error('Error creating recurring analysis:', recurringError);
      }
      
      // Reset form on success
      setProductUrl('');
      setIsCompetitor(true);
      setRecurring(false);
      setSuccess(true);
      
      // Reload the page after 2 seconds to show the new submission
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your analysis');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-[#1F2937] mb-4">Submit New Analysis</h2>
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
          Analysis submitted successfully! Your dashboard will update shortly.
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="product-url" className="block text-sm font-medium text-gray-700 mb-2">Product URL</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">🔗</span>
            </div>
            <input 
              type="url" 
              id="product-url" 
              className="block w-full pl-10 pr-12 py-3 border-gray-300 rounded-md focus:ring-[#2DD4BF] focus:border-[#2DD4BF] text-gray-900" 
              placeholder="https://example.com/product" 
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              required
            />
            {productUrl && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button 
                  type="button" 
                  onClick={() => setProductUrl('')}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="text-sm">✕</span>
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center">
            <div className="flex-shrink-0 text-[#2DD4BF] text-sm mr-1">ℹ️</div>
            <p className="text-xs text-gray-600">We'll automatically extract product details from the URL</p>
          </div>
        </div>
        
        <div className="mb-6 space-y-4">
          {/* Competitor product toggle button */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Competitor product</span>
            <button 
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2 ${isCompetitor ? 'bg-[#2DD4BF]' : 'bg-gray-200'}`}
              onClick={() => setIsCompetitor(!isCompetitor)}
              role="switch"
              aria-checked={isCompetitor}
              id="competitor-product"
            >
              <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCompetitor ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
          
          {/* Recurring analysis toggle button */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Set up recurring analysis</span>
            <button 
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2 ${recurring ? 'bg-[#2DD4BF]' : 'bg-gray-200'}`}
              onClick={() => setRecurring(!recurring)}
              role="switch"
              aria-checked={recurring}
              id="recurring-analysis"
            >
              <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${recurring ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>
        
        {/* Frequency dropdown - only visible when recurring is enabled */}
        {recurring && (
          <div className="mt-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 transition-all duration-300">
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">Analysis Frequency</label>
            <div className="relative">
              <select 
                id="frequency" 
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#2DD4BF] focus:border-[#2DD4BF] rounded-md appearance-none bg-white"
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">We'll automatically run this analysis at your selected frequency</p>
          </div>
        )}
        
        <button 
          type="submit" 
          className="w-full bg-[#2DD4BF] hover:bg-[#0D9488] text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Analysis'}
        </button>
      </form>
    </div>
  );
}
