'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastProps } from '../ui/toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastProps['type'], duration?: number) => void;
  hideToast: (id: string) => void;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastProps['type'];
  duration: number;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isMobilePosition, setIsMobilePosition] = useState(false);

  React.useEffect(() => {
    const check = () => setIsMobilePosition(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const showToast = useCallback((
    message: string, 
    type: ToastProps['type'] = 'info', 
    duration: number = 5000
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast Container - fixed position at top-right. Only render if there are active toasts. */}
      {toasts.length > 0 && (
        <div 
          data-testid="toast-container"
          className={`fixed z-50 flex flex-col gap-3 ${isMobilePosition ? 'bottom-20 left-1/2 w-11/12 transform -translate-x-1/2' : 'top-4 right-4'} backdrop-blur-md bg-white/70 dark:bg-gray-900/60 rounded-lg p-2`}
          aria-live="polite"
          aria-atomic="true"
        >
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              position={isMobilePosition ? 'bottom' : 'top'}
              onClose={hideToast}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};
