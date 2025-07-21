import { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const Toast = ({ toast, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-900/90 border-green-500/50 text-green-100';
      case 'error':
        return 'bg-red-900/90 border-red-500/50 text-red-100';
      case 'warning':
        return 'bg-amber-900/90 border-amber-500/50 text-amber-100';
      case 'info':
        return 'bg-blue-900/90 border-blue-500/50 text-blue-100';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        w-full backdrop-blur-lg rounded-lg border shadow-lg p-4
        transform transition-all duration-300 ease-in-out
        ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${getColorClasses()}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium">
            {toast.title}
          </p>
          {toast.message && (
            <p className="mt-1 text-sm opacity-90">
              {toast.message}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="inline-flex text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            onClick={handleClose}
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
