import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';

export function AppShell({ onSearch }) {
  return (
    <div className="mesh min-h-screen text-text">
      <div className="grid min-h-screen lg:grid-cols-[auto_1fr]">
        <Sidebar />
        <div className="flex min-w-0 flex-col">
          <Topbar onSearch={onSearch} />
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}