import { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastMessage } from './Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = {
      ...toast,
      id,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const showSuccess = (title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  };

  const showError = (title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  };

  const showWarning = (title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
        <div className="pointer-events-auto space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              toast={toast}
              onClose={removeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
