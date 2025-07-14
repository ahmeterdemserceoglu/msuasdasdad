'use client';

import { ReactNode } from 'react';
import AdminSidebar from '@/app/components/admin/AdminSidebar';
import { useAuth } from '@/app/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || !user.isAdmin)) {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user || !user.isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="flex">
                <AdminSidebar />
                <div className="flex-1 min-w-0 lg:ml-64">
                    <main className="p-4 lg:p-6 xl:p-8">
                        <div className="dark">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
