import { BrowserRouter } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './store/authStore';

export default function App() {
  const theme = useAuthStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-light', theme === 'light');
    root.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme === 'light');
    document.body.classList.toggle('theme-dark', theme === 'dark');
    root.dataset.theme = theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <div className={theme === 'dark' ? 'theme-dark' : 'theme-light'}>
        <Suspense fallback={<div className="min-h-screen bg-hero-glow text-white" />}>
          <AnimatePresence mode="wait">
            <AppRoutes />
          </AnimatePresence>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}