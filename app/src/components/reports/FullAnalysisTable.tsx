'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardSubmission } from '@/lib/dashboard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface FullAnalysisTableProps {
  submissions: DashboardSubmission[];
}

export default function FullAnalysisTable({ submissions }: FullAnalysisTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DashboardSubmission | null>(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(submission => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      submission.productTitle.toLowerCase().includes(searchTermLower) ||
      (submission.displayName && submission.displayName.toLowerCase().includes(searchTermLower)) ||
      submission.brandName.toLowerCase().includes(searchTermLower) ||
      submission.categoryName.toLowerCase().includes(searchTermLower) ||
      (submission.isCompetitor ? 'competitor' : 'your product').includes(searchTermLower) ||
      submission.status.toLowerCase().includes(searchTermLower)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubmissions.slice(indexOfFirstItem, indexOfLastItem);

  // Handle pagination
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Handle delete confirmation
  const handleDeleteClick = (submission: DashboardSubmission, event: React.MouseEvent) => {
    setSelectedSubmission(submission);
    setModalPosition({ x: event.clientX, y: event.clientY });
    setIsDeleteModalOpen(true);
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!selectedSubmission) return;

    try {
      const supabase = createClient();

      // Delete the submission from Supabase
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Close modal and refresh page
      setIsDeleteModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission. Please try again.');
    }
  };

  // Handle refresh action
  const handleRefresh = async (submissionToRefresh: DashboardSubmission) => {
    // Extract necessary info from the submission object
    const originalSubmissionId = submissionToRefresh.id;
    const productTitle = submissionToRefresh.productTitle || submissionToRefresh.displayName || 'Unknown Product';
    const url = submissionToRefresh.url; // Assume url is available on DashboardSubmission
    const asin = submissionToRefresh.asin;

    if (isRefreshing || !url) return; // Prevent multiple clicks or if URL is missing
    setIsRefreshing(originalSubmissionId);

    try {
      const supabase = createClient();
      
      // Get current user for the new record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create a new submission record for the refresh
      const { error } = await supabase
        .from('submissions')
        .insert({
          url: url,                     // Original URL
          user_id: user.id,             // Current user
          status: 'pending',              // Mark as pending for backend
          refresh_parent_id: originalSubmissionId, // Link to original
          product_title: productTitle,   // Copy title
          asin: asin                   // Copy ASIN if available
        });

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      toast({
        title: "Refresh Queued",
        description: `Analysis refresh added to the queue for ${productTitle}.`,
        variant: "default",
        className: "bg-blue-100/10 border-blue-500/20 text-[#1F2937]"
      });
      
      // No reload needed
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

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refreshing':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get category icon
  const getCategoryIcon = (category: string, isCompetitor: boolean) => {
    // Default icon
    let icon = '📦';

    // Category-specific icons
    switch (category.toLowerCase()) {
      case 'electronics':
        icon = '🔌';
        break;
      case 'clothing':
        icon = '👕';
        break;
      case 'food':
        icon = '🍔';
        break;
      case 'beauty':
        icon = '💄';
        break;
      case 'home':
        icon = '🏠';
        break;
      case 'toys':
        icon = '🧸';
        break;
      case 'sports':
        icon = '⚽';
        break;
      case 'books':
        icon = '📚';
        break;
      case 'automotive':
        icon = '🚗';
        break;
      case 'health':
        icon = '💊';
        break;
    }

    return icon;
  };

  return (
    <div>
      <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h3 className="text-lg leading-6 font-medium text-gray-900">All Analysis Reports</h3>
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search reports..."
              className="border border-gray-300 rounded-md py-2 px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <label htmlFor="items-per-page" className="text-sm text-gray-600">Show:</label>
            <select
              id="items-per-page"
              className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
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
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  {searchTerm ? 'No matching analyses found.' : 'No analyses available.'}
                </td>
              </tr>
            ) : (
              currentItems.map((submission) => (
                <tr key={submission.id} className="bg-white hover:bg-gray-50">
                  {/* ACTIONS COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-center space-x-3">
                      {/* View button */}
                      <div className="relative group">
                        <Link 
                          href={`/reports/${submission.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <span className="text-lg">👁️</span>
                        </Link>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                          View Analysis
                        </div>
                      </div>

                      {/* Download button */}
                      <div className="relative group">
                        <button 
                          className="text-green-600 hover:text-green-900"
                          onClick={() => {
                            // Implement download functionality
                            alert('Downloading report for ' + submission.productTitle);
                            // In a real implementation, this would trigger a download
                          }}
                        >
                          <span className="text-lg">📥</span>
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                          Download Report
                        </div>
                      </div>

                      {/* Refresh button */}
                      <button 
                        className="p-1 rounded-md text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-1"
                        onClick={() => handleRefresh(submission)} // Pass the whole submission
                        disabled={isRefreshing === submission.id || submission.status === 'pending' || submission.status === 'processing' || submission.status === 'refreshing'}
                        aria-label={isRefreshing === submission.id ? "Refreshing analysis" : "Refresh analysis"}
                      >
                        <span className="text-lg">{isRefreshing === submission.id ? '⏳' : '🔄'}</span>
                      </button>

                      {/* Delete button */}
                      <div className="relative group">
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={(e) => handleDeleteClick(submission, e)}
                        >
                          <span className="text-lg">🗑️</span>
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                          Delete Analysis
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* DATE COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.submissionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) || 'No date'}
                  </td>

                  {/* STATUS COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </td>

                  {/* PRODUCT COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-lg mr-2">
                        {getCategoryIcon(submission.categoryName, submission.isCompetitor)}
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.displayName || submission.productTitle}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* BRAND COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.brandName}
                  </td>

                  {/* CATEGORY COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.categoryName}
                  </td>

                  {/* TYPE COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.isCompetitor ? 'Competitor' : 'Your Product'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="text-sm text-gray-500">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSubmissions.length)} of {filteredSubmissions.length} reports
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`border rounded-md p-2 ${currentPage === 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-500 border-gray-300 hover:bg-gray-50'}`}
            aria-label="Previous page"
          >
            <span className="text-sm">←</span>
          </button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic to show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => paginate(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md ${
                    currentPage === pageNum
                      ? 'bg-[#2DD4BF] text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-gray-500">...</span>
                <button
                  onClick={() => paginate(totalPages)}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button 
            onClick={nextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`border rounded-md p-2 ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-500 border-gray-300 hover:bg-gray-50'}`}
            aria-label="Next page"
          >
            <span className="text-sm">→</span>
          </button>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Analysis"
        message={selectedSubmission ? `Are you sure you want to delete the analysis for ${selectedSubmission.displayName || selectedSubmission.productTitle}?` : 'Are you sure you want to delete this analysis?'}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        position={modalPosition}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
