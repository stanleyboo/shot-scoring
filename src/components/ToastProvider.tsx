'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const borderColor = {
    success: 'border-green-600',
    error: 'border-red-600',
    info: 'border-yellow-400',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
            {toasts.map(t => (
              <div
                key={t.id}
                className={`rounded-lg border ${borderColor[t.variant]} bg-[#111] px-4 py-3 text-sm text-stone-50 shadow-lg animate-[fadeIn_0.2s_ease-out]`}
              >
                {t.message}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
