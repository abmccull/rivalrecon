import { useEffect, useRef } from 'react';

// We'll completely remove this component and use the auth/ReCaptcha.tsx component instead
// This file can be deleted, but for now we'll leave a simple no-op implementation
interface ReCAPTCHAProps {
  siteKey: string;
  action: string;
  onVerify: (token: string) => void;
}

// This component is now deprecated. Use the auth/ReCaptcha.tsx component instead.
const ReCAPTCHA = ({ siteKey, action, onVerify }: ReCAPTCHAProps) => {
  console.warn('The ui/recaptcha.tsx component is deprecated. Please use auth/ReCaptcha.tsx instead.');
  return <div className="g-recaptcha" data-sitekey={siteKey} data-action={action}></div>;
};

export default ReCAPTCHA;
