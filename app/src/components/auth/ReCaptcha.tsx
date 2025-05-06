import React, { useRef, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import env from '@/lib/env-config';

// Add type definitions for enterprise version
declare global {
  interface Window {
    grecaptcha: {
      enterprise?: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
      ready?: (callback: () => void) => void;
      execute?: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ReCaptchaProps {
  onChange: (token: string | null) => void;
  onExpired?: () => void;
  size?: 'normal' | 'compact'; // normal = standard size, compact = invisible
  className?: string;
  action?: string; // For Enterprise reCAPTCHA
}

/**
 * Reusable ReCAPTCHA component for authentication flows
 */
const ReCaptcha: React.FC<ReCaptchaProps> = ({ 
  onChange, 
  onExpired, 
  size = 'normal',
  className = '',
  action = 'LOGIN'
}) => {
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);
  const [isEnterprise, setIsEnterprise] = useState(false);

  // Determine if we should use Enterprise version based on domain
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use Enterprise mode on production domain
      const hostname = window.location.hostname;
      const isProduction = hostname === 'rivalrecon.io' || hostname === 'www.rivalrecon.io';
      
      // Log the environment configuration for debugging
      console.log(`ReCaptcha environment: ${isProduction ? 'Production (Enterprise)' : 'Development (Standard)'}`);
      console.log(`ReCaptcha site key: ${env.recaptcha.siteKey}`);
      
      setIsEnterprise(isProduction);
    }
  }, []);

  // Handle Enterprise mode if applicable
  useEffect(() => {
    if (!isEnterprise) return; // Skip if not in enterprise mode
    
    if (typeof window === 'undefined' || !window.grecaptcha) {
      // Wait for grecaptcha to load
      const checkRecaptchaLoaded = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(checkRecaptchaLoaded);
          executeEnterpriseRecaptcha();
        }
      }, 100);
      
      return () => clearInterval(checkRecaptchaLoaded);
    }
    
    const executeEnterpriseRecaptcha = () => {
      try {
        if (window.grecaptcha?.enterprise) {
          console.log('Executing Enterprise reCAPTCHA with action:', action);
          window.grecaptcha.enterprise.ready(() => {
            window.grecaptcha.enterprise?.execute(env.recaptcha.siteKey, { action })
              .then(token => {
                console.log('Enterprise reCAPTCHA token generated successfully');
                onChange(token);
              })
              .catch(error => {
                console.error('reCAPTCHA Enterprise execution error:', error);
                onChange(null);
              });
          });
        } else {
          console.warn('Enterprise reCAPTCHA not found in window.grecaptcha even though environment is set to enterprise mode');
        }
      } catch (error) {
        console.error('Error executing Enterprise reCAPTCHA:', error);
        onChange(null);
      }
    };

    executeEnterpriseRecaptcha();

    // No cleanup needed
    return () => {};
  }, [isEnterprise, onChange, action]);

  // Reset when component unmounts (for standard version)
  useEffect(() => {
    return () => {
      if (!isEnterprise && recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    };
  }, [isEnterprise]);

  const handleChange = (token: string | null) => {
    onChange(token);
  };

  const handleExpired = () => {
    if (onExpired) onExpired();
    onChange(null);
  };

  // For Enterprise version, render a hidden div since the script handles everything
  if (isEnterprise) {
    return (
      <div className={className}>
        <div className="g-recaptcha" data-sitekey={env.recaptcha.siteKey} data-action={action}></div>
      </div>
    );
  }

  // Standard reCAPTCHA for development/testing
  return (
    <div className={className}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={env.recaptcha.siteKey}
        onChange={handleChange}
        onExpired={handleExpired}
        size={size === 'compact' ? 'compact' : 'normal'}
        theme="light"
      />
    </div>
  );
};

export default ReCaptcha;
