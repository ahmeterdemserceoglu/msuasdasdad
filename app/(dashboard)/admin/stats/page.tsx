'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';

interface AdminStats {
    totalPosts: number;
    pendingPosts: number;
    approvedPosts: number;
    rejectedPosts: number;
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    bannedUsers: number;
    todayPosts: number;
    weeklyPosts: number;
    monthlyPosts: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
    categories: {
        [key: string]: number;
    };
}

export default function AdminStatsPage() {
    const { user, loading } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/stats?userId=${user?.uid}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'İstatistikler alınamadı.');
            }

            const data = await response.json();
            setStats(data);
        } catch (error: Error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (loading) return;

        if (!user || !user.isAdmin) {
            toast.error('Bu alana erişim yetkiniz yok.');
            router.push('/');
            return;
        }

        fetchStats();
    }, [user, loading, router, fetchStats]);

    if (loading || isLoading) {
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
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">İstatistikler</h1>
                <p className="text-gray-600">Platform kullanım ve aktivite verileri</p>
            </div>

            {stats ? (
                <div className="space-y-8">
                    {/* Genel İstatistikler */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Genel Özet</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="p-4">
                                <div className="text-2xl font-bold text-blue-600">{stats.totalPosts}</div>
                                <div className="text-sm text-gray-600">Toplam Gönderi</div>
                            </Card>
                            <Card className="p-4">
                                <div className="text-2xl font-bold text-purple-600">{stats.totalUsers}</div>
                                <div className="text-sm text-gray-600">Toplam Kullanıcı</div>
                            </Card>
                            <Card className="p-4">
                                <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                                <div className="text-sm text-gray-600">Aktif Kullanıcı</div>
                            </Card>
                            <Card className="p-4">
                                <div className="text-2xl font-bold text-yellow-600">{stats.pendingPosts}</div>
                                <div className="text-sm text-gray-600">Bekleyen Gönderi</div>
                            </Card>
                        </div>
                    </div>

                    {/* Gönderi İstatistikleri */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Gönderi Durumları</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-4">
                                <div className="text-2xl font-bold text-green-600">{stats.approvedPosts}</div>
                                <div className="text-sm text-gray-600">Onaylanan</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {stats.totalPosts > 0 ? 
                                        `${Math.round((stats.approvedPosts / stats.totalPosts) * 100)}% of total` : 
                                        '0%'
                                    }
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="text-2xl font-bold text-red-600">{stats.rejectedPosts}</div>
                                <div className="text-sm text-gray-600">Reddedilen</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {stats.totalPosts > 0 ? 
                                        `${Math.round((stats.rejectedPosts / stats.totalPosts) * 100)}% of total` : 
                                        '0%'
                                    }
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="text-2xl font-bold text-yellow-600">{stats.pendingPosts}</div>
                                <div className="text-sm text-gray-600">Bekleyen</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {stats.totalPosts > 0 ? 
                                        `${Math.round((stats.pendingPosts / stats.totalPosts) * 100)}% of total` : 
                                        '0%'
                                    }
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Kullanıcı İstatistikleri */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Kullanıcı Durumları</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-4">
                                <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                                <div className="text-sm text-gray-600">Aktif</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {stats.totalUsers > 0 ? 
                                        `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total` : 
                                        '0%'
                                    }
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="text-2xl font-bold text-yellow-600">{stats.suspendedUsers}</div>
                                <div className="text-sm text-gray-600">Askıda</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {stats.totalUsers > 0 ? 
                                        `${Math.round((stats.suspendedUsers / stats.totalUsers) * 100)}% of total` : 
                                        '0%'
                                    }
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="text-2xl font-bold text-red-600">{stats.bannedUsers}</div>
                                <div className="text-sm text-gray-600">Yasaklı</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {stats.totalUsers > 0 ? 
                                        `${Math.round((stats.bannedUsers / stats.totalUsers) * 100)}% of total` : 
                                        '0%'
                                    }
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Zaman Bazlı İstatistikler */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Aktivite Trendi</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Gönderiler</h3>
                                <div className="space-y-4">
                                    <Card className="p-4">
                                        <div className="text-xl font-bold text-blue-600">{stats.todayPosts}</div>
                                        <div className="text-sm text-gray-600">Bugün</div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="text-xl font-bold text-indigo-600">{stats.weeklyPosts}</div>
                                        <div className="text-sm text-gray-600">Bu Hafta</div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="text-xl font-bold text-purple-600">{stats.monthlyPosts}</div>
                                        <div className="text-sm text-gray-600">Bu Ay</div>
                                    </Card>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Kullanıcılar</h3>
                                <div className="space-y-4">
                                    <Card className="p-4">
                                        <div className="text-xl font-bold text-green-600">{stats.newUsersToday}</div>
                                        <div className="text-sm text-gray-600">Bugün</div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="text-xl font-bold text-teal-600">{stats.newUsersWeek}</div>
                                        <div className="text-sm text-gray-600">Bu Hafta</div>
                                    </Card>
                                    <Card className="p-4">
                                        <div className="text-xl font-bold text-cyan-600">{stats.newUsersMonth}</div>
                                        <div className="text-sm text-gray-600">Bu Ay</div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kategori İstatistikleri */}
                    {stats.categories && Object.keys(stats.categories).length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Kategori Dağılımı</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(stats.categories).map(([category, count]) => (
                                    <Card key={category} className="p-4">
                                        <div className="text-xl font-bold text-gray-900">{count}</div>
                                        <div className="text-sm text-gray-600 capitalize">{category}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {stats.totalPosts > 0 ? 
                                                `${Math.round((count / stats.totalPosts) * 100)}% of total` : 
                                                '0%'
                                            }
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <p className="text-gray-500 text-lg">İstatistikler yüklenemedi.</p>
                </Card>
            )}
        </div>
    );
}
