"use client";

import { useEffect, useRef, useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  position?: { x: number; y: number };
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
  position
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [calculatedPosition, setCalculatedPosition] = useState<{ top: number; left: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Calculate position when modal opens or position changes
  useEffect(() => {
    if (isOpen && position && modalRef.current) {
      const modalRect = modalRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 15; // Padding from viewport edges

      // Initial desired position (below and to the left of the cursor)
      let desiredTop = position.y + padding;
      let desiredLeft = position.x - modalRect.width - padding;

      // Adjust if it goes off-screen vertically
      if (desiredTop + modalRect.height > viewportHeight - padding) {
        desiredTop = viewportHeight - modalRect.height - padding; // Align to bottom edge
      }
      if (desiredTop < padding) {
        desiredTop = padding; // Align to top edge
      }

      // Adjust if it goes off-screen horizontally (try left first, then right)
      if (desiredLeft < padding) { // If goes off left
        desiredLeft = position.x + padding; // Try placing to the right
        if (desiredLeft + modalRect.width > viewportWidth - padding) { // If still goes off right
          desiredLeft = viewportWidth - modalRect.width - padding; // Align to right edge
        }
      } else if (desiredLeft + modalRect.width > viewportWidth - padding) { // If goes off right initially
        desiredLeft = viewportWidth - modalRect.width - padding; // Align to right edge
      }
      
      // Ensure left isn't negative after adjustments
      desiredLeft = Math.max(padding, desiredLeft);

      setCalculatedPosition({ top: desiredTop, left: desiredLeft });
      setIsVisible(true); // Make visible after calculation

    } else if (isOpen && !position) {
        // If centered, make visible immediately
        setCalculatedPosition(null); // Ensure calculation is reset
        setIsVisible(true);
    } else {
        // Reset visibility if closed
        setIsVisible(false);
    }
  }, [isOpen, position]);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // We're not preventing scrolling since we want the modal to overlay the page
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onCancel]);

  // Handle escape key press
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Determine button colors based on type
  const getButtonColors = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-red-500 hover:bg-red-600 text-white',
          icon: '🗑️'
        };
      case 'warning':
        return {
          confirm: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          icon: '⚠️'
        };
      case 'info':
      default:
        return {
          confirm: 'bg-[#2DD4BF] hover:bg-[#0D9488] text-white',
          icon: 'ℹ️'
        };
    }
  };

  const buttonColors = getButtonColors();

  // Determine the final style
  let modalStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 50,
      opacity: isVisible ? 1 : 0, // Control visibility
      transition: 'opacity 0.15s ease-in-out', // Smooth fade-in/out
  };

  if (position && calculatedPosition) {
    // Use calculated position if available
    modalStyle = {
      ...modalStyle,
      top: `${calculatedPosition.top}px`,
      left: `${calculatedPosition.left}px`,
    };
  } else if (!position) {
    // Use default centered position if no position prop provided
    modalStyle = {
      ...modalStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }
  // Note: If position is provided but calculatedPosition is still null (very briefly on first render),
  // the modal remains hidden due to opacity: 0

  return (
    <div style={modalStyle}>
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-80 overflow-hidden border border-gray-200 transition-all"
      >
        <div className="flex items-center p-4 border-b border-gray-200">
          <span className="text-2xl mr-3">{buttonColors.icon}</span>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors font-medium"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`px-4 py-2 ${buttonColors.confirm} rounded-md transition-colors font-medium`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
