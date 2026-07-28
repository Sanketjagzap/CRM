import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../store/authStore';

export function Modal({ open, title, onClose, children, size = 'md' }) {
  const theme = useAuthStore((state) => state.theme);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const onKey = (e) => {
      if (e.key === 'Escape' && open) onClose && onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      setIsMounted(false);
    };
  }, [open, onClose]);

  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    full: 'max-w-[95vw]',
  };

  const modalContent = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close modal"
          />
          <motion.div
            className={`relative z-10 my-4 w-full ${sizeMap[size] || sizeMap.md} ${
              theme === 'light'
                ? 'rounded-3xl border border-slate-200 bg-white shadow-glass'
                : 'rounded-3xl border border-white/10 bg-slate-950/95 shadow-glass'
            } flex max-h-[88vh] flex-col`}
            initial={{ y: 24, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div
              className={`sticky top-0 z-10 flex shrink-0 items-center justify-between rounded-t-3xl border-b ${
                theme === 'light'
                  ? 'border-slate-200 bg-white/80 px-5 py-4 backdrop-blur'
                  : 'border-white/10 bg-slate-950/80 px-5 py-4 backdrop-blur'
              }`}
            >
              <h3 className={`text-base font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
              <button
                onClick={onClose}
                className={`rounded-lg p-2 transition ${
                  theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/8'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className={`min-h-0 flex-1 overflow-y-auto p-5 ${theme === 'light' ? 'text-slate-800' : ''}`}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (!isMounted) {
    return null;
  }

  return createPortal(modalContent, document.body);
}