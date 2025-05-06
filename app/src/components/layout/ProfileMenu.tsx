'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient();
      const { data: { user: typedUser } } = await supabase.auth.getUser();
      
      if (!typedUser) return;
      
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
          } else if (typedUser.user_metadata?.first_name) {
            setFirstName(typedUser.user_metadata.first_name);
          } else {
            setFirstName('User');
          }
          
          // Set avatar URL if available
          if (profileData.avatar_url) {
            setAvatarUrl(profileData.avatar_url);
          }
        } else if (typedUser.user_metadata?.first_name) {
          setFirstName(typedUser.user_metadata.first_name);
        } else {
          setFirstName('User');
        }
      } catch (error) {
        // Silently fail and use default
        setFirstName('User');
      }
    };

    fetchUserProfile();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle sign out
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-2">
        {firstName && <span className="hidden md:inline text-gray-700">Hi, {firstName}</span>}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full border-2 border-[#2DD4BF] bg-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors overflow-hidden"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt="User avatar" 
              width={40} 
              height={40} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-700">👤</span>
          )}
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
          <Link 
            href="/settings" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center">
              <span className="mr-2">⚙️</span>
              <span>Settings</span>
            </div>
          </Link>
          
          <Link 
            href="/help" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center">
              <span className="mr-2">❓</span>
              <span>Help Center</span>
            </div>
          </Link>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            <div className="flex items-center">
              <span className="mr-2">🚪</span>
              <span>Sign out</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
