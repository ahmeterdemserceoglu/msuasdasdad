'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';

interface PendingPost {
    id: string;
    title: string;
    content: string;
    userId: string;
    createdAt: string;
    status: 'pending';
    author: {
        id: string;
        name: string;
        email: string;
    };
}

export default function AdminPendingPostsPage() {
    const { user, loading, firebaseUser } = useAuth();
    const [posts, setPosts] = useState<PendingPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const fetchPendingPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            if (!firebaseUser) {
                throw new Error('Kullanıcı oturumu bulunamadı.');
            }

            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/posts/admin/pending', {
                headers: {
                    'authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Bekleyen gönderiler alınamadı.');
            }

            const data = await response.json();
            setPosts(data.posts || []);
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred while fetching pending posts.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [firebaseUser]);

    useEffect(() => {
        if (loading) return;

        if (!user || !user.isAdmin) {
            toast.error('Bu alana erişim yetkiniz yok.');
            router.push('/');
            return;
        }

        fetchPendingPosts();
    }, [user, loading, router, fetchPendingPosts]);

    const handlePostAction = async (postId: string, action: 'approve' | 'reject') => {
        try {
            if (!firebaseUser) {
                throw new Error('Kullanıcı oturumu bulunamadı.');
            }

            const token = await firebaseUser.getIdToken();

            console.log('PostId:', postId);

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
                reject: 'reddedildi'
            };

            toast.success(`Gönderi ${actionTexts[action]}.`);
            fetchPendingPosts();
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred during the post action.");
            }
        }
    };

    const filteredPosts = posts.filter(post =>
        !searchTerm ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Bekleyen Gönderiler</h1>
                <p className="text-gray-600">Moderasyona bekleyen gönderileri inceleyin ve onaylayın</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{posts.length}</div>
                    <div className="text-sm text-gray-600">Bekleyen Gönderi</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{filteredPosts.length}</div>
                    <div className="text-sm text-gray-600">Filtrelenmiş Sonuç</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                        {new Set(posts.map(p => p.author.id)).size}
                    </div>
                    <div className="text-sm text-gray-600">Farklı Kullanıcı</div>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Başlık, içerik, kullanıcı adı veya email ile arama..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Posts List */}
            <div className="space-y-4">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                        <Card key={post.id} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    {post.title && (
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                                    )}
                                    <p className="text-gray-900 mb-3">{post.content}</p>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                                        <span>👤 {post.author.name}</span>
                                        <span>📧 {post.author.email}</span>
                                        <span>📅 {new Date(post.createdAt).toLocaleString('tr-TR')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                            Moderasyon Bekliyor
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                                <Button
                                    onClick={() => handlePostAction(post.id, 'approve')}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                                >
                                    ✅ Onayla
                                </Button>
                                <Button
                                    onClick={() => handlePostAction(post.id, 'reject')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm"
                                >
                                    ❌ Reddet
                                </Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card className="p-8 text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-gray-500 text-lg">
                            {posts.length === 0
                                ? 'Harika! Bekleyen gönderi bulunmuyor.'
                                : 'Arama kriterlerine uygun gönderi bulunamadı.'}
                        </p>
                        {searchTerm && (
                            <p className="text-gray-400 mt-2">
                                &quot;{searchTerm}&quot; araması için sonuç bulunamadı.
                            </p>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
