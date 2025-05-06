"use client";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { User } from "@supabase/supabase-js";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const { user, signOut, loading } = useAuth();
  const typedUser = user as User | null;
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);
  const supabase = createClient();


  // Get user's first name from profile table or user metadata
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!typedUser) {
        return;
      }
      
      try {
        // First try to get from profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', typedUser.id)
          .single();
          
        if (profileData && !error) {
          
          // Use first_name if available, otherwise use fallbacks
          if (profileData.first_name) {
            setFirstName(profileData.first_name);
          } else if (profileData.display_name) {
            setFirstName(profileData.display_name.split(' ')[0]);
          }
          
          // Set avatar URL if available
          if (profileData.avatar_url) {
            setAvatarUrl(profileData.avatar_url);
          }
          
          return;
        } else if (error) {
          console.log("Header - Error fetching profile:", error);
        }
        
        // Fallback to metadata
        console.log("Header - Using user metadata fallback");
        if (typedUser.user_metadata?.first_name) {
          setFirstName(typedUser.user_metadata.first_name);
        } else if (typedUser.user_metadata?.full_name) {
          setFirstName(typedUser.user_metadata.full_name.split(' ')[0]);
        } else if (typedUser.email) {
          setFirstName(typedUser.email.split('@')[0]);
        } else {
          setFirstName('User');
        }
        
        // Check for avatar in metadata
        if (typedUser.user_metadata?.avatar_url) {
          setAvatarUrl(typedUser.user_metadata.avatar_url);
        }
      } catch (error) {
        console.error('Header - Error fetching profile data:', error);
        
        // Use fallbacks if fetching fails
        if (typedUser.user_metadata?.first_name) {
          setFirstName(typedUser.user_metadata.first_name);
        } else if (typedUser.email) {
          setFirstName(typedUser.email.split('@')[0]);
        } else {
          setFirstName('User');
        }
      }
    };
    
    fetchProfileData();
  }, [typedUser, supabase]);

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

  // Get user initials for avatar placeholder
  const getInitials = () => {
    if (!firstName) return 'U';
    return firstName.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <span className="text-[#1E3A8A] font-bold text-2xl">RivalRecon</span>
            {/* Replace ChartBarIcon with your icon import if needed */}
            <svg className="text-[#2DD4BF] ml-1 h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="/dashboard" className="text-gray-800 font-medium hover:text-[#2DD4BF] transition-colors cursor-pointer">Dashboard</Link>
            <Link href="/analysis" className="text-gray-800 font-medium hover:text-[#2DD4BF] transition-colors cursor-pointer">Analysis</Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center">
            
            {/* User greeting */}
            {typedUser && !loading && (
              <span className="text-gray-700 font-medium mr-2">
                Hi, {firstName}
              </span>
            )}
            
            {/* Avatar image */}
            <div className="relative" ref={menuRef}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl}
                  alt="User Avatar" 
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-[#2DD4BF] cursor-pointer object-cover w-10 h-10"
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
                    Account Settings
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
} 