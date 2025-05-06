"use client";

import { useState } from 'react';
import Link from 'next/link';
import { DashboardSubmission } from '@/lib/dashboard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@/lib/supabase/custom-types';
import { useToast } from '@/components/ui/use-toast';

// Custom tooltip component that won't get cropped by table edges
function ActionTooltip({ text }: { text: string }) {
  return (
    <div className="absolute z-[100] w-max px-2 py-1 -mt-8 text-xs text-white transform -translate-x-1/2 bg-gray-800 rounded left-1/2 opacity-0 group-hover:opacity-100 pointer-events-none shadow-lg transition-opacity">
      <div className="relative">
        {text}
        <div className="absolute left-1/2 -bottom-1 transform -translate-x-1/2 border-t-4 border-r-4 border-l-4 border-t-gray-800 border-r-transparent border-l-transparent" />
      </div>
    </div>
  );
}

export default function AnalysisHistory({ submissions = [] }: { submissions: DashboardSubmission[] }) {
  // State for confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DashboardSubmission | null>(null);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null); // Track which submission is refreshing
  const { toast } = useToast(); // Initialize toast notification system

  // Helper function to get appropriate emoji for product category
  const getCategoryIcon = (category: string, isCompetitor: boolean) => {
    const lowerCategory = category?.toLowerCase() || '';

    if (isCompetitor) {
      return '🔍'; // Magnifying glass for competitor products
    }

    if (lowerCategory.includes('food') || lowerCategory.includes('snack')) {
      return '🍔';
    } else if (lowerCategory.includes('drink') || lowerCategory.includes('beverage')) {
      return '🥤';
    } else if (lowerCategory.includes('tech') || lowerCategory.includes('electronic')) {
      return '💻';
    } else if (lowerCategory.includes('beauty') || lowerCategory.includes('cosmetic')) {
      return '💄';
    } else if (lowerCategory.includes('health') || lowerCategory.includes('fitness')) {
      return '💪';
    } else if (lowerCategory.includes('home') || lowerCategory.includes('furniture')) {
      return '🏠';
    } else if (lowerCategory.includes('clothing') || lowerCategory.includes('apparel')) {
      return '👕';
    } else if (lowerCategory.includes('toy') || lowerCategory.includes('game')) {
      return '🎮';
    } else {
      return '📦'; // Default box emoji
    }
  };

  // Helper function to get appropriate color for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'refreshing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter submissions based on search term
  const [searchTerm, setSearchTerm] = useState('');
  const filteredSubmissions = submissions.filter(submission =>
    submission.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (submission: DashboardSubmission, event: React.MouseEvent) => {
    setSelectedSubmission(submission);
    // Calculate position relative to the viewport
    const rect = (event.target as Element).getBoundingClientRect();
    setModalPosition({ x: rect.left + window.scrollX, y: rect.bottom + window.scrollY });
    setIsDeleteModalOpen(true);
  };

  // Handle refresh action
  const handleRefresh = async (submissionToRefresh: DashboardSubmission) => {
    if (isRefreshing) return; // Prevent multiple clicks if already processing one
    
    const originalSubmissionId = submissionToRefresh.id;
    setIsRefreshing(originalSubmissionId); // Track which original submission is being processed

    try {
      const supabase = createClient();
      
      // Get current user - necessary for the new submission record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create a new submission record for the refresh
      const { error } = await supabase
        .from('submissions')
        .insert({
          url: submissionToRefresh.url, // Copy URL from original
          user_id: user.id,            // Assign to current user
          status: 'pending',             // Mark as pending for the backend task
          refresh_parent_id: originalSubmissionId, // Link to the original submission
          product_title: submissionToRefresh.productTitle, // Copy basic info
          asin: submissionToRefresh.asin // Copy basic info
        });

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      // Increment the submission counter
      // Add detailed logging to help debug the issue
      console.log('Incrementing submission counter for refresh operation, user:', user.id);
      
      try {
        // Cast to our custom SupabaseClient type to enable proper type checking
        const customClient = supabase as unknown as SupabaseClient;
        const { error: counterError } = await customClient.rpc(
          'increment_submission_counter', // Function name as it exists in Supabase
          { user_id_param: user.id }
        );

        if (counterError) {
          console.error('Error incrementing submission counter:', counterError);
        } else {
          console.log('Successfully incremented submission counter for refresh');
        }
      } catch (counterErr) {
        console.error('Exception in counter increment during refresh:', counterErr);
      }

      toast({
        title: "Refresh Queued",
        description: `Analysis refresh added to the queue for ${submissionToRefresh.displayName || submissionToRefresh.productTitle}.`, // Updated message
        variant: "default",
        className: "bg-blue-100/10 border-blue-500/20 text-[#1F2937]"
      });
      
      // No page reload needed - backend handles status changes now
      // window.location.reload(); 

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

  const handleDeleteConfirm = async () => {
    if (selectedSubmission) {
      try {
        console.log('Deleting analysis for', selectedSubmission.id);
        
        // Create Supabase client
        const supabase = createClient();
        
        // Step 1: First handle the foreign key constraint by updating child submissions
        // that reference this submission as their parent (through refresh_parent_id)
        const { error: updateChildrenError } = await supabase
          .from('submissions')
          .update({ refresh_parent_id: null }) // Remove the reference
          .eq('refresh_parent_id', selectedSubmission.id);
        
        if (updateChildrenError) {
          console.log('Warning: Could not update child submissions:', updateChildrenError);
          // Continue anyway - there might not be any child submissions
        }
        
        // Step 2: Delete reviews associated with this submission
        const { error: deleteReviewsError } = await supabase
          .from('reviews')
          .delete()
          .eq('submission_id', selectedSubmission.id);
          
        if (deleteReviewsError) {
          console.log('Warning: Could not delete related reviews:', deleteReviewsError);
          // Continue anyway - there might not be any reviews
        }
        
        // Step 3: Delete analysis associated with this submission
        const { error: deleteAnalysisError } = await supabase
          .from('analyses')
          .delete()
          .eq('submission_id', selectedSubmission.id);
        
        if (deleteAnalysisError) {
          console.log('Warning: Could not delete analysis:', deleteAnalysisError);
          // Continue - there might not be an analysis yet
        }
        
        // Step 4: Finally delete the submission itself
        const { error: deleteSubmissionError } = await supabase
          .from('submissions')
          .delete()
          .eq('id', selectedSubmission.id);
        
        if (deleteSubmissionError) {
          // This is a critical error - if we get here, something is wrong
          throw deleteSubmissionError;
        }
        
        // Show a styled toast notification instead of browser alert
        toast({
          title: "Analysis Deleted",
          description: `${selectedSubmission.displayName || selectedSubmission.productTitle} has been deleted.`,
          variant: "default",
          className: "bg-[#2DD4BF]/10 border-[#2DD4BF]/20 text-[#1F2937]"
        });
        
        // Refresh the submissions list
        window.location.reload();
        
        // Close the modal
        setIsDeleteModalOpen(false);
        setSelectedSubmission(null);
        setModalPosition(undefined);
      } catch (error) {
        console.error('Error deleting analysis:', error);
        
        // Use toast instead of alert for error messages
        toast({
          title: "Delete Failed",
          description: `Failed to delete analysis. ${error instanceof Error ? error.message : 'Please try again.'} Error details have been logged to console.`,
          variant: "destructive",
        });
        
        // Log more detailed error information
        if (error instanceof Error) {
          console.log('Error name:', error.name);
          console.log('Error message:', error.message);
          console.log('Error stack:', error.stack);
        } else {
          console.log('Non-Error object thrown:', error);
        }
        
        // Close the modal
        setIsDeleteModalOpen(false);
        setSelectedSubmission(null);
        setModalPosition(undefined);
      }
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Analyses</h3>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search analyses..."
              className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link 
            href="/reports" 
            className="text-[#2DD4BF] hover:text-[#0D9488] text-sm font-medium flex items-center"
          >
            View all reports
            <span className="ml-1">→</span>
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  No analyses found. Try a different search term or add a new analysis.
                </td>
              </tr>
            ) : (
              filteredSubmissions.slice(0, 10).map((submission) => (
                <tr key={submission.id} className="bg-white hover:bg-gray-50">
                  {/* ACTIONS COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-center space-x-3">
                      {/* View button with tooltip */}
                      <div className="relative group">
                        <Link
                          href={`/reports/${submission.id}`} // Use submission.id directly
                          className="text-blue-600 hover:text-blue-900"
                          aria-label="View analysis"
                        >
                          <span className="text-lg">👁️</span>
                        </Link>
                        <ActionTooltip text="View Analysis" />
                      </div>
                      {/* Refresh Button */}
                      <button 
                        className="relative group text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed mx-1"
                        onClick={() => handleRefresh(submission)} // Pass the whole submission object
                        disabled={isRefreshing === submission.id || submission.status === 'pending' || submission.status === 'processing' || submission.status === 'refreshing'} // Disable if already refreshing/processing or pending
                        aria-label={isRefreshing === submission.id ? "Refreshing analysis" : "Refresh analysis"}
                      >
                        <span className="text-lg">{isRefreshing === submission.id ? '⏳' : '🔄'}</span>
                        <ActionTooltip text={isRefreshing === submission.id ? "Refreshing..." : "Refresh Analysis"} />
                      </button>
                      {/* Delete button with tooltip */}
                      <div className="group inline-flex items-center relative">
                        <button 
                          title="Delete Analysis" 
                          className="text-gray-400 hover:text-red-600 relative group"
                          onClick={(e) => handleDeleteClick(submission, e)} // Call the handler
                        >
                          {/* Trash Can Icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="tooltip-container pointer-events-none">
                          <span className="fixed top-auto left-auto hidden group-hover:block bg-gray-800 text-white text-xs rounded py-2 px-4 whitespace-nowrap z-[100] shadow-lg">
                            Delete Analysis
                            <span className="absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-800"></span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </td>
                  {/* DATE CELL */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.submissionDate} {/* Render the pre-formatted date string */}
                  </td>
                  {/* STATUS CELL */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.status)}`}>{submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-lg mr-2">{getCategoryIcon(submission.categoryName, submission.isCompetitor)}</div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.displayName ? submission.displayName : submission.productTitle}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.brandName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.isCompetitor ? 'Competitor' : 'Your Product'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-500">
          Showing {Math.min(filteredSubmissions.length, 10)} of {submissions.length} analyses
        </div>
        
        {submissions.length > 10 && (
          <Link href="/reports" className="flex items-center">
            <span className="text-xs text-[#2DD4BF] hover:text-[#0D9488] bg-teal-50 px-3 py-1 rounded-full flex items-center">
              View all in Reports
              <span className="ml-1">→</span>
            </span>
          </Link>
        )}
      </div>
      
      {/* Custom Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onCancel={() => { 
          setIsDeleteModalOpen(false);
          setSelectedSubmission(null);
          setModalPosition(undefined);
        }}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the analysis for "${selectedSubmission?.displayName || selectedSubmission?.productTitle}"? This action cannot be undone.`}
        position={modalPosition}
      />
    </div>
  );
}
