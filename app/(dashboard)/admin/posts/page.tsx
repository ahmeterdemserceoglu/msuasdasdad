'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Card, { CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Select from '@/app/components/ui/Select';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/app/components/ui/Modal';
import {
    FileText, Search, Clock, CheckCircle, XCircle,
    MessageSquare, Heart, MapPin, Tag, User, Calendar,
    Eye, Trash2, MoreVertical, Loader, AlertTriangle
} from 'lucide-react';

// TypeScript Arayüzleri
interface Post {
    id: string;
    title: string;
    content: string;
    userId: string;
    createdAt: string;
    likes: number;
    commentsCount: number;
    status: 'pending' | 'approved' | 'rejected';
    userEmail?: string;
    displayName?: string;
    category?: string;
    city?: string;
    tags?: string[];
    postType?: string;
    views?: number;
    reportCount?: number;
}

interface PostStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

interface DropdownMenuProps {
    post: Post;
    onAction: (action: 'approve' | 'reject' | 'delete') => void;
    onView: () => void;
}

// Dropdown Menu Component
const DropdownMenu = ({ post, onAction, onView }: DropdownMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const dropdownHeight = 250; // Approximate height of dropdown
            const dropdownWidth = 192; // 48 * 4 (w-48 in tailwind)

            let top = buttonRect.bottom + 8; // 8px gap
            let left = buttonRect.right - dropdownWidth;

            // Check if dropdown would go off screen bottom
            if (top + dropdownHeight > window.innerHeight) {
                // Position above the button
                top = buttonRect.top - dropdownHeight - 8;
            }

            // Check if dropdown would go off screen left
            if (left < 0) {
                left = 8; // 8px from edge
            }

            // Check if dropdown would go off screen right
            if (left + dropdownWidth > window.innerWidth) {
                left = window.innerWidth - dropdownWidth - 8;
            }

            setDropdownPosition({ top, left });
        }
    }, [isOpen]);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex justify-center rounded-md border border-gray-600/80 px-3 py-2 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-military-green"
            >
                <MoreVertical className="h-5 w-5" />
            </button>

            {isOpen && dropdownPosition && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed w-48 bg-gray-800 border border-gray-700 divide-y divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[9999]"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`
                    }}
                >
                    <div className="py-1">
                        <button
                            onClick={() => {
                                onView();
                                setIsOpen(false);
                            }}
                            className="group flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700"
                        >
                            <Eye className="mr-3 h-5 w-5" />
                            Detayları Gör
                        </button>

                        {post.status !== 'approved' && (
                            <button
                                onClick={() => {
                                    onAction('approve');
                                    setIsOpen(false);
                                }}
                                className="group flex items-center w-full px-4 py-2 text-sm text-green-400 hover:bg-gray-700"
                            >
                                <CheckCircle className="mr-3 h-5 w-5" />
                                Onayla
                            </button>
                        )}

                        {post.status !== 'rejected' && (
                            <button
                                onClick={() => {
                                    onAction('reject');
                                    setIsOpen(false);
                                }}
                                className="group flex items-center w-full px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700"
                            >
                                <XCircle className="mr-3 h-5 w-5" />
                                Reddet
                            </button>
                        )}
                    </div>
                    <div className="py-1">
                        <button
                            onClick={() => {
                                onAction('delete');
                                setIsOpen(false);
                            }}
                            className="group flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                        >
                            <Trash2 className="mr-3 h-5 w-5" />
                            Sil
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    colorClass: string;
}

// Yardımcı Fonksiyonlar ve Bileşenler
const StatCard = ({ title, value, icon, colorClass }: StatCardProps) => (
    <Card className="bg-gray-800/50 p-4 border border-gray-700/50">
        <div className="flex items-center">
            <div className={`p-2 bg-${colorClass}-500/20 rounded-lg mr-4`}>
                {icon}
            </div>
            <div>
                <div className={`text-2xl font-bold text-${colorClass}-400`}>{value}</div>
                <div className="text-sm text-gray-400">{title}</div>
            </div>
        </div>
    </Card>
);

interface StatusBadgeProps {
    status: 'approved' | 'pending' | 'rejected';
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
    const statusStyles = {
        approved: 'bg-green-900/50 text-green-300 border-green-500/30',
        pending: 'bg-yellow-900/50 text-yellow-300 border-yellow-500/30',
        rejected: 'bg-red-900/50 text-red-300 border-red-500/30',
    };
    const statusTexts = {
        approved: 'Onaylandı',
        pending: 'Bekliyor',
        rejected: 'Reddedildi'
    };
    const Icon = {
        approved: CheckCircle,
        pending: Clock,
        rejected: XCircle,
    }[status];

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[status]}`}>
            <Icon className="h-4 w-4 mr-1.5" />
            {statusTexts[status]}
        </span>
    );
};

export default function AdminPostsPage() {
    const { user, loading, firebaseUser } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState<PostStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            if (!firebaseUser) {
                throw new Error('Kullanıcı oturumu bulunamadı.');
            }

            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/posts/admin', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gönderiler alınamadı.');
            }

            const data = await response.json();
            setPosts(data.posts || []);
            setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
        } catch (error) {
            if (error instanceof Error) {
                console.error('Fetch posts error:', error);
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred while fetching posts.");
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
        // firebaseUser'ın yüklenmesini bekle
        if (firebaseUser) {
            fetchPosts();
        }
    }, [user, loading, router, firebaseUser, fetchPosts]);

    const handlePostAction = async (postId: string, action: 'approve' | 'reject' | 'delete') => {
        try {
            const token = await firebaseUser?.getIdToken();
            const response = await fetch(`/api/posts/admin/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ postId })
            });
            if (!response.ok) throw new Error(`İşlem başarısız: ${action}`);
            toast.success(`Gönderi başarıyla ${action === 'approve' ? 'onaylandı' : action === 'reject' ? 'reddedildi' : 'silindi'}.`);
            fetchPosts();
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred during the post action.");
            }
        }
    };

    const filteredPosts = posts.filter(post => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (post.title.toLowerCase().includes(searchLower) ||
                post.content.toLowerCase().includes(searchLower) ||
                post.displayName?.toLowerCase().includes(searchLower) ||
                post.userEmail?.toLowerCase().includes(searchLower)) &&
            (!filterStatus || post.status === filterStatus) &&
            (!filterCategory || post.category === filterCategory)
        );
    });

    const openPostModal = (post: Post) => {
        setSelectedPost(post);
        setIsModalOpen(true);
    };

    if (loading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <Loader className="animate-spin h-12 w-12 text-military-green" />
            </div>
        );
    }

    return (
        <div className="w-full text-white">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-100 mb-1">Gönderi Yönetimi</h1>
                <p className="text-gray-400">Platform üzerindeki tüm gönderileri yönetin, filtreleyin ve denetleyin.</p>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <StatCard title="Toplam Gönderi" value={stats.total} icon={<FileText className="h-6 w-6 text-blue-400" />} colorClass="blue" />
                    <StatCard title="Bekleyen" value={stats.pending} icon={<Clock className="h-6 w-6 text-yellow-400" />} colorClass="yellow" />
                    <StatCard title="Onaylanan" value={stats.approved} icon={<CheckCircle className="h-6 w-6 text-green-400" />} colorClass="green" />
                    <StatCard title="Reddedilen" value={stats.rejected} icon={<XCircle className="h-6 w-6 text-red-400" />} colorClass="red" />
                </div>
            )}

            <Card className="bg-gray-800/60 border border-gray-700/60">
                <CardHeader className="border-b border-gray-700/60 p-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Arama yap..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-600/80 rounded-lg focus:ring-2 focus:ring-military-green focus:border-transparent transition"
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                options={[
                                    { value: '', label: 'Tüm Durumlar' },
                                    { value: 'pending', label: 'Bekleyen' },
                                    { value: 'approved', label: 'Onaylanan' },
                                    { value: 'rejected', label: 'Reddedilen' }
                                ]}
                                className="w-full md:w-48 bg-gray-900/50 border-gray-600/80 text-white"
                            />
                            <Select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                options={[
                                    { value: '', label: 'Tüm Kategoriler' },
                                    { value: 'sozlu', label: 'Sözlü Mülakat' },
                                    { value: 'spor', label: 'Spor Testi' },
                                    { value: 'evrak', label: 'Evrak İncelemesi' },
                                    { value: 'psikolojik', label: 'Psikolojik Test' },
                                    { value: 'diger', label: 'Diğer' }
                                ]}
                                className="w-full md:w-48 bg-gray-900/50 border-gray-600/80 text-white"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Gönderi</th>
                                    <th scope="col" className="px-6 py-3">Kullanıcı</th>
                                    <th scope="col" className="px-6 py-3">İstatistikler</th>
                                    <th scope="col" className="px-6 py-3">Durum</th>
                                    <th scope="col" className="px-6 py-3 text-right">Eylemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPosts.map((post) => (
                                    <tr key={post.id} className="bg-gray-800/50 border-b border-gray-700/60 hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white max-w-xs truncate">{post.title || 'Başlıksız'}</div>
                                            <div className="text-gray-400 max-w-xs truncate">{post.content}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{post.displayName || 'Bilinmeyen'}</div>
                                            <div className="text-gray-500">{post.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4 text-gray-400">
                                                <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {post.likes}</span>
                                                <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {post.commentsCount}</span>
                                                <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {post.views || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={post.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu
                                                post={post}
                                                onAction={(action) => handlePostAction(post.id, action)}
                                                onView={() => openPostModal(post)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {filteredPosts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <AlertTriangle className="h-12 w-12 mb-4" />
                                                <h3 className="text-lg font-semibold">Sonuç Bulunamadı</h3>
                                                <p>Arama kriterlerinize uygun gönderi bulunamadı.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="2xl">
                {selectedPost && (
                    <div className="bg-gray-800 text-white rounded-lg">
                        <ModalHeader className="border-b border-gray-700">
                            <ModalTitle>{selectedPost.title}</ModalTitle>
                        </ModalHeader>
                        <ModalBody className="max-h-[60vh] overflow-y-auto p-6">
                            <p className="text-gray-300 mb-6 whitespace-pre-wrap">{selectedPost.content}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-700 pt-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg text-military-beige">Gönderi Bilgileri</h4>
                                    <div className="flex items-center"><User className="h-5 w-5 mr-3 text-gray-400" /> <span>{selectedPost.displayName || 'Bilinmeyen Kullanıcı'} ({selectedPost.userEmail})</span></div>
                                    <div className="flex items-center"><Calendar className="h-5 w-5 mr-3 text-gray-400" /> <span>{new Date(selectedPost.createdAt).toLocaleString('tr-TR')}</span></div>
                                    <div className="flex items-center"><MapPin className="h-5 w-5 mr-3 text-gray-400" /> <span>{selectedPost.city || 'Şehir Belirtilmemiş'}</span></div>
                                    <div className="flex items-center"><Tag className="h-5 w-5 mr-3 text-gray-400" /> <span>{selectedPost.category || 'Kategori Yok'}</span></div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg text-military-beige">Etkileşim</h4>
                                    <div className="flex items-center"><Heart className="h-5 w-5 mr-3 text-gray-400" /> <span>{selectedPost.likes} Beğeni</span></div>
                                    <div className="flex items-center"><MessageSquare className="h-5 w-5 mr-3 text-gray-400" /> <span>{selectedPost.commentsCount} Yorum</span></div>
                                    <div className="flex items-center"><Eye className="h-5 w-5 mr-3 text-gray-400" /> <span>{selectedPost.views || 0} Görüntülenme</span></div>
                                    <div className="flex items-center text-yellow-400"><AlertTriangle className="h-5 w-5 mr-3" /> <span>{selectedPost.reportCount || 0} Rapor</span></div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter className="border-t border-gray-700">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Kapat</Button>
                        </ModalFooter>
                    </div>
                )}
            </Modal>
        </div>
    );
}
