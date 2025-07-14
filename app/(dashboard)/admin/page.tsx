'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Select from '@/app/components/ui/Select';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/app/components/ui/Modal';
import { 
    Search,
    Calendar,
    Users,
    Shield,
    AlertCircle
} from 'lucide-react';

interface Post {
    id: string;
    content: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    createdAt: string;
    likes: number;
    status?: 'pending' | 'approved' | 'rejected';
    category?: string;
    city?: string;
    tags?: string[];
}

interface AdminStats {
    totalPosts: number;
    pendingPosts: number;
    approvedPosts: number;
    rejectedPosts: number;
    totalUsers: number;
    todayPosts: number;
}

export default function AdminDashboardPage() {
    const { user, loading, firebaseUser } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('all');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const router = useRouter();
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    const fetchAdminData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (!firebaseUser) {
                throw new Error('Kullanıcı oturumu bulunamadı.');
            }
            
            const token = await firebaseUser.getIdToken();
            
            // Gönderileri ve istatistikleri paralel olarak al
            const [postsResponse, statsResponse] = await Promise.all([
                fetch(`/api/posts/admin?userId=${user?.uid}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`/api/admin/stats?userId=${user?.uid}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            // Gönderileri işle
            if (!postsResponse.ok) {
                const errorData = await postsResponse.json();
                throw new Error(errorData.error || 'Gönderiler alınamadı.');
            }
            const postsData = await postsResponse.json();
            setPosts(postsData.posts || postsData || []);

            // İstatistikleri işle
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                // API'den gelen veriyi doğrudan state'e ata
                setStats(statsData);
            } else {
                // İstatistik API'si başarısız olursa hata göster
                console.error("Failed to fetch stats from API.");
                toast.error("İstatistikler yüklenemedi.");
                setStats(null);
            }
        } catch (error: Error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [firebaseUser, user?.uid]);

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['all', 'pending', 'approved', 'rejected'].includes(tabParam)) {
            setSelectedTab(tabParam);
        }
    }, [searchParams]);

    useEffect(() => {
        // Kullanıcı bilgisi yüklenmedişĩse bekle
        if (loading) return;

        // Kullanıcı giriş yapmamışĩsa veya admin değilse ana sayfaya yönlendir
        if (!user || !user.isAdmin) {
            toast.error('Bu alana erişim yetkiniz yok.');
            router.push('/');
            return;
        }
        
        // Firebase user yüklenmesini bekle
        if (firebaseUser) {
            fetchAdminData();
        }
    }, [user, loading, router, firebaseUser, fetchAdminData]);

    const handlePostAction = async (postId: string, action: 'approve' | 'reject' | 'delete') => {
        if (action === 'reject') {
            setSelectedPostId(postId);
            setRejectModalOpen(true);
            return;
        }
        
        try {
            if (!firebaseUser) {
                throw new Error('Kullanıcı oturumu bulunamadı.');
            }

            const token = await firebaseUser.getIdToken();
            const response = await fetch(`/api/posts/admin/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ postId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'İşlem başarısız.');
            }

            const actionTexts = {
                approve: 'onaylandı',
                reject: 'reddedildi',
                delete: 'silindi'
            };

            toast.success(`Gönderi ${actionTexts[action]}.`);
            fetchAdminData(); // Verileri yeniden yükle
        } catch (error: Error) {
            toast.error(error.message);
        }
    };

    const handleRejectConfirm = async () => {
        if (!selectedPostId || !rejectReason.trim()) {
            toast.error('Lütfen reddetme sebebini girin.');
            return;
        }

        try {
            if (!firebaseUser) {
                throw new Error('Kullanıcı oturumu bulunamadı.');
            }

            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/posts/admin/reject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ postId: selectedPostId, reason: rejectReason })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'İşlem başarısız.');
            }

            toast.success('Gönderi reddedildi.');
            setRejectModalOpen(false);
            setSelectedPostId(null);
            setRejectReason('');
            fetchAdminData();
        } catch (error: Error) {
            toast.error(error.message);
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesSearch = !searchTerm || 
            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = !filterStatus || post.status === filterStatus;
        const matchesTab = selectedTab === 'all' || 
            (selectedTab === 'pending' && post.status === 'pending') ||
            (selectedTab === 'approved' && post.status === 'approved') ||
            (selectedTab === 'rejected' && post.status === 'rejected');
        
        return matchesSearch && matchesStatus && matchesTab;
    });

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
        <div className="w-full p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Admin Paneli</h1>
                <p className="text-gray-600 dark:text-gray-400">Sistem yönetimi ve içerik moderasyonu</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">Toplam</div>
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalPosts}</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">Gönderi</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                        <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-2 uppercase tracking-wider">Onay Bekliyor</div>
                        <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pendingPosts}</div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">Bekleyen</div>
                        {stats.pendingPosts > 0 && (
                            <div className="mt-3">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                                    Aksiyon gerekli
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 uppercase tracking-wider">Yayında</div>
                        <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.approvedPosts}</div>
                        <div className="text-sm text-green-700 dark:text-green-300 mt-1">Onaylanan</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 uppercase tracking-wider">İptal</div>
                        <div className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.rejectedPosts}</div>
                        <div className="text-sm text-red-700 dark:text-red-300 mt-1">Reddedilen</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wider">Aktif</div>
                        <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.totalUsers}</div>
                        <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">Kullanıcı</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wider">Bugün</div>
                        <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{stats.todayPosts}</div>
                        <div className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">Yeni Gönderi</div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'all', label: 'Tümü', count: posts.length },
                            { id: 'pending', label: 'Bekleyen', count: posts.filter(p => p.status === 'pending').length },
                            { id: 'approved', label: 'Onaylanan', count: posts.filter(p => p.status === 'approved').length },
                            { id: 'rejected', label: 'Reddedilen', count: posts.filter(p => p.status === 'rejected').length }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    selectedTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Gönderi içeriği veya kullanıcı email'i ile arama..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
                <div className="w-full md:w-48">
                    <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        options={[
                            { value: '', label: 'Tüm Durumlar' },
                            { value: 'pending', label: 'Bekleyen' },
                            { value: 'approved', label: 'Onaylanan' },
                            { value: 'rejected', label: 'Reddedilen' }
                        ]}
                        placeholder="Durum Filtresi"
                    />
                </div>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                        <Card key={post.id} className="p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <p className="text-gray-900 dark:text-gray-100 mb-3 line-clamp-3">{post.content}</p>
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Kullanıcı:</span> {post.userName || 'Anonim'} {post.userEmail && `(${post.userEmail})`}
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Tarih:</span> {new Date(post.createdAt).toLocaleString('tr-TR')}
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Beğeni:</span> {post.likes}
                                        </span>
                                        {post.category && (
                                            <span className="text-gray-600 dark:text-gray-400">
                                                <span className="font-medium">Kategori:</span> {post.category}
                                            </span>
                                        )}
                                        {post.city && (
                                            <span className="text-gray-600 dark:text-gray-400">
                                                <span className="font-medium">Şehir:</span> {post.city}
                                            </span>
                                        )}
                                    </div>
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {post.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                        post.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        post.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                        {post.status === 'approved' ? 'Onaylandı' :
                                         post.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {post.status !== 'approved' && (
                                    <Button
                                        onClick={() => handlePostAction(post.id, 'approve')}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-lg font-medium transition-colors"
                                    >
                                        Onayla
                                    </Button>
                                )}
                                {post.status !== 'rejected' && (
                                    <Button
                                        onClick={() => handlePostAction(post.id, 'reject')}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm rounded-lg font-medium transition-colors"
                                    >
                                        Reddet
                                    </Button>
                                )}
                                <Button
                                    onClick={() => handlePostAction(post.id, 'delete')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm rounded-lg font-medium transition-colors"
                                >
                                    Sil
                                </Button>
                            </div>
                            </Card>
                    ))
                ) : (
                    <Card className="p-8 text-center">
                        <p className="text-gray-500 text-lg">Gösterilecek gönderi bulunamadı.</p>
                        {searchTerm && (
                            <p className="text-gray-400 mt-2">
                                "{searchTerm}" araması için sonuç bulunamadı.
                            </p>
                        )}
                    </Card>
                )}
            </div>

            {/* Reject Reason Modal */}
            <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)}>
                <ModalHeader>
                    <ModalTitle>Reddetme Sebebi</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Reddetme sebebini girin..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button onClick={() => setRejectModalOpen(false)} className="bg-gray-200">Vazgeç</Button>
                    <Button onClick={() => handleRejectConfirm()} className="bg-red-600 text-white">Reddet</Button>
                </ModalFooter>
            </Modal>

        </div>
    );
}
