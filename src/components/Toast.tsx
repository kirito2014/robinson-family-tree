'use client';

import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500',
          border: 'border-green-600',
          icon: 'check_circle'
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          border: 'border-red-600',
          icon: 'error'
        };
      case 'info':
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-600',
          icon: 'info'
        };
      default:
        return {
          bg: 'bg-gray-500',
          border: 'border-gray-600',
          icon: 'info'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in">
      <div className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md`}>
        <div className="flex-shrink-0">
          <span className={`material-symbols-outlined text-white`}>
            {styles.icon}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-white font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <span className="material-symbols-outlined text-white text-sm">
            close
          </span>
        </button>
      </div>
    </div>
  );
};

export default Toast;