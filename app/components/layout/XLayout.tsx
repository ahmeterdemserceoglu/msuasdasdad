'use client';

import MainSidebar from './MainSidebar';
import { ReactNode } from 'react';

interface XLayoutProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
  containerClassName?: string;
}

export default function XLayout({ children, rightSidebar, containerClassName }: XLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Left Sidebar */}
      <MainSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-20 xl:ml-72 transition-all duration-300">
        <div className={containerClassName || 'max-w-2xl mx-auto border-x border-[var(--border)] min-h-screen relative'}>
          {children}
        </div>
      </main>

      {/* Right Sidebar */}
      {rightSidebar && (
        <aside className="w-96 hidden lg:block p-4 overflow-y-auto animate-fade-in max-h-screen sticky top-0">
          {rightSidebar}
        </aside>
      )}
    </div>
  );
}
