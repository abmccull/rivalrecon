"use client";

import { useEffect, useRef } from 'react';

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

  // Calculate position based on clicked coordinates or default to center
  const modalStyle = position ? {
    position: 'fixed' as const,
    top: `${position.y}px`,
    left: `${position.x}px`,
    transform: 'translate(-90%, -50%)', // Position it to the left of the cursor
    zIndex: 50
  } : {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 50
  };

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
