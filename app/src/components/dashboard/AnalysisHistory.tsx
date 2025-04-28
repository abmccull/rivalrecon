"use client";

import { useState } from 'react';
import Link from 'next/link';
import { DashboardSubmission } from '@/lib/dashboard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { createClient } from '@/lib/supabase/client';

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
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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
                          href={submission.analysisId ? `/reports/${submission.analysisId}` : `/reports/${submission.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          aria-label="View analysis"
                        >
                          <span className="text-lg">👁️</span>
                        </Link>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                          View Analysis
                        </div>
                      </div>
                      {/* Download button with tooltip */}
                      <div className="group inline-flex items-center relative">
                        {submission.status === 'completed' ? (
                          <button
                            className="text-blue-500 hover:text-blue-700 flex items-center relative"
                            aria-label="Download report"
                            onClick={() => {
                              console.log('Attempting to download report for', submission.id);
                              alert(`Download functionality is being rebuilt. Report for ${submission.productTitle} will be available soon.`);
                            }}
                          >
                            <span className="text-lg">📥</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 cursor-not-allowed flex items-center">
                            <span className="text-lg">📥</span>
                          </span>
                        )}
                        <span className="tooltip-container pointer-events-none">
                          <span className="fixed top-auto left-auto hidden group-hover:block bg-gray-800 text-white text-xs rounded py-2 px-4 whitespace-nowrap z-[100] shadow-lg">
                            Download Report
                            <span className="absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-800"></span>
                          </span>
                        </span>
                      </div>
                      {/* Refresh button with tooltip */}
                      <div className="group inline-flex items-center relative">
                        <button
                          className={`${submission.status === 'processing' || submission.status === 'refreshing' || isRefreshing === submission.id ? 'text-gray-400 cursor-not-allowed' : 'text-green-500 hover:text-green-700'} flex items-center relative`}
                          aria-label="Refresh analysis"
                          disabled={submission.status === 'processing' || submission.status === 'refreshing' || isRefreshing === submission.id}
                          onClick={() => {
                            console.log('Refresh clicked for', submission.id);
                            setIsRefreshing(submission.id);
                            alert(`Refresh functionality is being rebuilt. Analysis for ${submission.productTitle} will be updated soon.`);
                            setTimeout(() => {
                              setIsRefreshing(null);
                            }, 2000);
                          }}
                        >
                          <span className="text-lg">{isRefreshing === submission.id ? '⏳' : '🔄'}</span>
                        </button>
                        <span className="tooltip-container pointer-events-none">
                          <span className="fixed top-auto left-auto hidden group-hover:block bg-gray-800 text-white text-xs rounded py-2 px-4 whitespace-nowrap z-[100] shadow-lg">
                            {isRefreshing === submission.id ? 'Refreshing...' : 'Refresh Analysis'}
                            <span className="absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-800"></span>
                          </span>
                        </span>
                      </div>
                      {/* Delete button with tooltip */}
                      <div className="group inline-flex items-center relative">
                        <button
                          className="text-red-500 hover:text-red-700 flex items-center relative"
                          aria-label="Delete analysis"
                          onClick={() => handleDeleteClick(submission)}
                        >
                          <span className="text-lg">🗑️</span>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.status)}`}>{submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-lg mr-2">{getCategoryIcon(submission.categoryName, submission.isCompetitorProduct)}</div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{submission.productTitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.brandName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.categoryName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.isCompetitorProduct ? 'Competitor' : 'Your Product'}</td>
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
        title="Delete Analysis"
        message={selectedSubmission ? `Are you sure you want to delete the analysis for ${selectedSubmission.productTitle}?` : 'Are you sure you want to delete this analysis?'}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        position={modalPosition}
        onConfirm={async () => {
          if (selectedSubmission) {
            try {
              console.log('Deleting analysis for', selectedSubmission.id);
              
              // Create Supabase client
              const supabase = createClient();
              
              // Delete the analysis from Supabase
              const { error: deleteSubmissionError } = await supabase
                .from('submissions')
                .delete()
                .eq('id', selectedSubmission.id);
              
              if (deleteSubmissionError) throw deleteSubmissionError;
              
              // If there's an associated analysis, delete that too
              if (selectedSubmission.analysisId) {
                const { error: deleteAnalysisError } = await supabase
                  .from('analyses')
                  .delete()
                  .eq('id', selectedSubmission.analysisId);
                
                if (deleteAnalysisError) {
                  console.error('Error deleting analysis record:', deleteAnalysisError);
                  // Continue even if this fails, as the submission is already deleted
                }
                
                // Delete any associated files in storage
                const { error: deleteStorageError } = await supabase
                  .storage
                  .from('analysis-reports')
                  .remove([`${selectedSubmission.id}/report.pdf`]);
                
                if (deleteStorageError) {
                  console.error('Error deleting storage files:', deleteStorageError);
                  // Continue even if this fails, as the main records are already deleted
                }
              }
              
              alert(`Analysis for ${selectedSubmission.productTitle} has been deleted.`);
              // Refresh the submissions list
              window.location.reload();
              
              // Close the modal
              setIsDeleteModalOpen(false);
              setSelectedSubmission(null);
              setModalPosition(undefined);
            } catch (error) {
              console.error('Error deleting analysis:', error);
              alert('Failed to delete analysis. Please try again.');
              
              // Close the modal
              setIsDeleteModalOpen(false);
              setSelectedSubmission(null);
              setModalPosition(undefined);
            }
          }
        }}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSelectedSubmission(null);
          setModalPosition(undefined);
        }}
      />
    </div>
  );
}
