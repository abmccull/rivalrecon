import { useContext } from 'react';
import { SupabaseAuthContext } from '../contexts/SupabaseAuthProvider';

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  
  return context;
}; 