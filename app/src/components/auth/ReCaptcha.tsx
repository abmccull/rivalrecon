import React, { useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import env from '@/lib/env-config';

interface ReCaptchaProps {
  onChange: (token: string | null) => void;
  onExpired?: () => void;
  size?: 'normal' | 'compact'; // normal = standard size, compact = invisible
  className?: string;
}

/**
 * Reusable ReCAPTCHA component for authentication flows
 */
const ReCaptcha: React.FC<ReCaptchaProps> = ({ 
  onChange, 
  onExpired, 
  size = 'normal',
  className = ''
}) => {
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  // Reset when component unmounts
  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    };
  }, []);

  const handleChange = (token: string | null) => {
    onChange(token);
  };

  const handleExpired = () => {
    if (onExpired) onExpired();
    onChange(null);
  };

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
