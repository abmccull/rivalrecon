"use client";
import { useState, useEffect, useMemo, useRef } from "react";
// Define types locally since we haven't created the @/lib/dashboard module yet
interface DashboardSubmission {
  id: string;
  analysisId?: string;
  productTitle?: string;
  brandName?: string;
  categoryName?: string;
  url: string;
  status: string;
  createdAt: string;
}

interface DashboardMetrics {
  totalAnalyses: number;
  completedAnalyses: number;
  inProgressAnalyses: number;
  competitorsTracked?: number;
  reviewsAnalyzed?: number;
}

interface DashboardInsight {
  id: string;
  title: string;
  description: string;
  type: string;
  text?: string;
  date?: string;
  analysisId?: string;
  displayName?: string; // AI-generated display name from the analyses table
  submissionTitle?: string; // Keeping for backward compatibility
}
import { Button } from "@/components/ui/button";

interface DashboardClientProps {
  submissions: DashboardSubmission[];
  metrics: DashboardMetrics;
  insights: DashboardInsight[];
}

import Link from "next/link";
import { useAuth } from "@/components/layout/AuthProvider";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faBell, faBars, faCheck, faCloudArrowUp, faBottleWater, faCookieBite, faPumpSoap, faSprayCanSparkles, faChartPie, faBinoculars, faComments, faArrowUp, faChevronLeft, faChevronRight, faDownload, faTrashAlt, faSearch, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

export default function DashboardClient({ submissions, metrics, insights }: DashboardClientProps) {
  // ...existing state...
  const [isCompetitor, setIsCompetitor] = useState(true); // default: competitor
  const [recurring, setRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('weekly');

  // State for search/filter
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const handleRefresh = async (analysisId?: string) => {
    if (!analysisId) return;
    setRefreshingId(analysisId);
    try {
      // Call the submissions refresh API endpoint
      const response = await fetch(`/api/submissions/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submissionId: analysisId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh analysis');
      }
      // Optionally show a notification/toast here
    } catch (err) {
      // Handle errors with a more specific error message
      console.error('Error refreshing analysis:', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRefreshingId(null);
    }
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      if (statusFilter !== 'all' && submission.status !== statusFilter) return false;
      if (searchText.trim() === '') return true;
      const search = searchText.toLowerCase();
      return (
        submission.productTitle?.toLowerCase().includes(search) ||
        submission.brandName?.toLowerCase().includes(search) ||
        submission.categoryName?.toLowerCase().includes(search)
      );
    });
  }, [submissions, searchText, statusFilter]);

  // --- Profile/avatar state ---
  const { user, signOut, loading } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Try to get avatar from metadata or fallback
    if (user.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    }
    if (user.user_metadata?.first_name) {
      setFirstName(user.user_metadata.first_name);
    } else if (user.user_metadata?.full_name) {
      setFirstName(user.user_metadata.full_name.split(' ')[0]);
    } else if (user.email) {
      setFirstName(user.email.split('@')[0]);
    } else {
      setFirstName('User');
    }
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (open && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  const getInitials = () => {
    if (!firstName) return 'U';
    return firstName.charAt(0).toUpperCase();
  };

  // Metrics fallback
  const totalAnalyses = metrics?.totalAnalyses ?? 24;
  const competitorsTracked = metrics?.competitorsTracked ?? 7;
  const reviewsAnalyzed = metrics?.reviewsAnalyzed ?? 4382;

  // Helper for status badge
  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'processing':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Processing</span>;
      case 'failed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Failed</span>;
      case 'refreshing':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Refreshing</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };



  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <span className="text-[#1E3A8A] font-bold text-2xl">RivalRecon</span>
              <FontAwesomeIcon icon={faChartLine} className="text-[#2DD4BF] ml-1" />
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-gray-800 font-medium hover:text-[#2DD4BF] transition-colors cursor-pointer">Dashboard</Link>
              <Link href="/reports" className="text-gray-800 font-medium hover:text-[#2DD4BF] transition-colors cursor-pointer">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <FontAwesomeIcon icon={faBell} className="text-gray-600 text-xl cursor-pointer hover:text-[#2DD4BF]" />
              {/* Profile Dropdown */}
              <div className="relative" ref={menuRef}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-[#2DD4BF] cursor-pointer object-cover"
                    onClick={() => setOpen((v) => !v)}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full border-2 border-[#2DD4BF] bg-[#1E3A8A] text-white flex items-center justify-center cursor-pointer text-lg font-medium"
                    onClick={() => setOpen((v) => !v)}
                  >
                    {getInitials()}
                  </div>
                )}
                {open && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 transition"
                      onClick={() => setOpen(false)}
                    >
                      Profile & Settings
                    </Link>
                    <Link
                      href="/help"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 transition"
                      onClick={() => setOpen(false)}
                    >
                      Help
                    </Link>
                    <button
                      onClick={() => { setOpen(false); signOut && signOut(); }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition text-red-600"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button className="md:hidden text-gray-800">
              <FontAwesomeIcon icon={faBars} className="text-xl" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-[#F7FAFC] pb-16">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1F2937]">Competitor Analysis Dashboard</h1>
            <p className="text-gray-600 mt-2">Submit product URLs for analysis and review your submission history</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Submission Form & Bulk Upload */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-[#1F2937] mb-4">Submit New Analysis</h2>
                <form onSubmit={e => {
                  e.preventDefault();
                  const url = (document.getElementById('product-url') as HTMLInputElement)?.value;
                  // Prepare payload for Supabase/backend
                  const payload = {
                    url,
                    isCompetitorProduct: isCompetitor,
                    recurring,
                    recurringFrequency: recurring ? recurringFrequency : undefined,
                  };
                  // Trigger refresh for the analysis
                  // Making this an async IIFE to allow await usage
                  (async () => {
                    try {
                      const response = await fetch('/api/submissions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                  });
                  const analysis = await response.json();
                      handleRefresh(analysis.id);
                    } catch (error) {
                      console.error('Failed to submit analysis:', error);
                    }
                  })();
                }}>
                  <div className="mb-4">

                    <label htmlFor="product-url" className="block text-sm font-medium text-gray-700 mb-1">Product URL</label>
                    <input type="url" id="product-url" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent" placeholder="https://www.example.com/product" />
                  </div>
                  <div className="mb-4 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-700 min-w-[180px]">
                        {isCompetitor ? 'Competitor product' : 'Our product'}
                      </span>
                      <button
                        type="button"
                        aria-pressed={isCompetitor}
                        onClick={() => setIsCompetitor((v) => !v)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isCompetitor ? 'bg-[#2DD4BF]' : 'bg-gray-300'}`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isCompetitor ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-700 min-w-[180px]">Recurring analysis</span>
                      <button
                        type="button"
                        aria-pressed={recurring}
                        onClick={() => setRecurring((v) => !v)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${recurring ? 'bg-[#2DD4BF]' : 'bg-gray-300'}`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${recurring ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                  {recurring && (
                    <div className="mb-6">
                      <label htmlFor="recurring-frequency" className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <select
                        id="recurring-frequency"
                        value={recurringFrequency}
                        onChange={e => setRecurringFrequency(e.target.value)}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  )}
                  <button type="submit" className="w-full bg-[#2DD4BF] text-white py-2 px-4 rounded-md font-medium hover:bg-opacity-90 transition-all transform hover:scale-105">Submit for Analysis</button>
                </form>
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Analysis includes:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start"><FontAwesomeIcon icon={faCheck} className="text-[#2DD4BF] mt-1 mr-2" />Sentiment analysis of all reviews</li>
                    <li className="flex items-start"><FontAwesomeIcon icon={faCheck} className="text-[#2DD4BF] mt-1 mr-2" />Key themes and topics identification</li>
                    <li className="flex items-start"><FontAwesomeIcon icon={faCheck} className="text-[#2DD4BF] mt-1 mr-2" />Competitive advantage insights</li>
                    <li className="flex items-start"><FontAwesomeIcon icon={faCheck} className="text-[#2DD4BF] mt-1 mr-2" />Rating trends over time</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold text-[#1F2937] mb-4">Bulk Upload</h2>
                <p className="text-sm text-gray-600 mb-4">Analyze multiple competitor products at once by uploading a CSV file.</p>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <FontAwesomeIcon icon={faCloudArrowUp} className="text-4xl text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Drag and drop your CSV file here, or</p>
                  <button className="text-[#2DD4BF] font-medium hover:underline">browse files</button>
                  <input type="file" className="hidden" accept=".csv" />
                </div>
                <button className="w-full mt-4 border border-[#2DD4BF] text-[#2DD4BF] py-2 px-4 rounded-md font-medium hover:bg-[#2DD4BF] hover:text-white transition-colors">Upload CSV</button>
                <span className="block text-center text-sm text-[#2DD4BF] mt-2 hover:underline cursor-pointer">Download template</span>
              </div>
            </div>
            {/* Right Column - Analysis History, Quick Stats, Insights */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#1F2937]">Recent Analysis</h2>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input type="text" placeholder="Search analyses" className="border border-gray-300 rounded-md py-1 px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent" value={searchText} onChange={e => setSearchText(e.target.value)} />
                      <FontAwesomeIcon icon={faSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <select className="border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                      <option value="all">All</option>
                      <option value="completed">Completed</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSubmissions.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-6 text-gray-400">No analyses found.</td></tr>
                      )}
                      {filteredSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              className={`text-gray-400 hover:text-blue-600 ${refreshingId === sub.analysisId ? 'cursor-not-allowed opacity-50' : ''}`}
                              onClick={() => handleRefresh(sub.analysisId)}
                              disabled={refreshingId === sub.analysisId}
                              title="Refresh Analysis"
                            >
                              <FontAwesomeIcon icon={faSyncAlt} spin={refreshingId === sub.analysisId} />
                            </button>
                            <a href={sub.analysisId ? `/dashboard/analysis/${sub.analysisId}` : '#'} className="text-[#2DD4BF] hover:underline">View</a>
                            <button className="text-gray-400 hover:text-gray-600">
                              <FontAwesomeIcon icon={faDownload} />
                            </button>
                            <button className="text-gray-400 hover:text-red-600">
                              <FontAwesomeIcon icon={faTrashAlt} />
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <FontAwesomeIcon icon={faBottleWater} className="text-blue-400" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{sub.productTitle}</div>
                                <div className="text-sm text-gray-500">{sub.categoryName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{sub.brandName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{sub.createdAt}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {statusBadge(sub.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {filteredSubmissions.length} of {submissions.length} analyses
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                </div>
              </div>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-500">Total Analyses</h3>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FontAwesomeIcon icon={faChartPie} className="text-[#1E3A8A]" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <span className="text-3xl font-bold text-[#1F2937]">{totalAnalyses}</span>
                    <span className="ml-2 text-sm text-green-600 flex items-center">
                      <FontAwesomeIcon icon={faArrowUp} className="mr-1" />8% <span className="text-gray-500 ml-1">vs last month</span>
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-500">Competitors Tracked</h3>
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <FontAwesomeIcon icon={faBinoculars} className="text-[#2DD4BF]" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <span className="text-3xl font-bold text-[#1F2937]">{competitorsTracked}</span>
                    <span className="ml-2 text-sm text-green-600 flex items-center">
                      <FontAwesomeIcon icon={faArrowUp} className="mr-1" />2 <span className="text-gray-500 ml-1">new this month</span>
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-500">Reviews Analyzed</h3>
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <FontAwesomeIcon icon={faComments} className="text-purple-600" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <span className="text-3xl font-bold text-[#1F2937]">{reviewsAnalyzed}</span>
                    <span className="ml-2 text-sm text-green-600 flex items-center">
                      <FontAwesomeIcon icon={faArrowUp} className="mr-1" />12% <span className="text-gray-500 ml-1">vs last month</span>
                    </span>
                  </div>
                </div>
              </div>
              {/* Recent Insights */}
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold text-[#1F2937] mb-4">Recent Insights</h2>
                
                {/* State for expanded insights */}
                {(() => {
                  // Using IIFE to create local state within JSX
                  const [isExpanded, setIsExpanded] = useState(false);
                  const initialCount = 5;
                  const displayedInsights = isExpanded ? insights : insights.slice(0, initialCount);
                  const toggleExpand = () => setIsExpanded(!isExpanded);
                  
                  return (
                    <>
                      {/* Insights container with conditional max-height and scrolling */}
                      <div className={`space-y-4 ${isExpanded ? 'max-h-[500px] overflow-y-auto pr-2' : ''}`}>
                        {displayedInsights.length > 0 ? (
                          displayedInsights.map((insight) => (
                            <div key={insight.id} className="border-l-4 border-[#2DD4BF] pl-4 py-1">
                              <p className="text-gray-600">{insight.text}</p>
                              <div className="flex flex-col items-start mt-1 gap-0.5">
                                <span className="text-xs text-gray-400">{insight.date}</span>
                                {insight.analysisId && (
                                  <a
                                    href={`/dashboard/analysis/${insight.analysisId}`}
                                    className="text-xs text-[#2DD4BF] hover:underline font-medium"
                                  >
                                    {insight.displayName || insight.submissionTitle || 'View Analysis'}
                                  </a>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400">No recent insights.</div>
                        )}
                      </div>
                      
                      {/* Only show toggle button if there are more insights than the initial display count */}
                      {insights.length > initialCount && (
                        <button 
                          onClick={toggleExpand} 
                          className="block w-full text-center text-[#2DD4BF] mt-4 hover:underline cursor-pointer transition-colors"
                        >
                          {isExpanded ? 'Show less' : 'View all insights'}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-[#1E3A8A] font-bold text-lg mr-1">RivalRecon</span>
              <FontAwesomeIcon icon={faChartLine} className="text-[#2DD4BF] ml-1" />
              <span className="text-sm text-gray-500 ml-4">© {new Date().getFullYear()} All rights reserved</span>
            </div>
            <div className="flex space-x-6">
              <span className="text-sm text-gray-600 hover:text-[#2DD4BF] cursor-pointer">Help Center</span>
              <span className="text-sm text-gray-600 hover:text-[#2DD4BF] cursor-pointer">Privacy Policy</span>
              <span className="text-sm text-gray-600 hover:text-[#2DD4BF] cursor-pointer">Terms of Service</span>
              <span className="text-sm text-gray-600 hover:text-[#2DD4BF] cursor-pointer">Contact Us</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
