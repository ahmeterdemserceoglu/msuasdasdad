'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import {
    Users, Shield, UserCheck, UserX, Clock, Calendar,
    Mail, Phone, MapPin, FileText, Search, Ban, CheckCircle,
    XCircle, Loader, Unlock, UserPlus, RefreshCw,
    MoreHorizontal, Eye, Lock
} from 'lucide-react';

// --- Arayüz Tanımları (Değişiklik Yok) ---
interface User {
    id: string;
    email: string;
    displayName?: string;
    isAdmin: boolean;
    createdAt: string;
    lastLoginAt?: string;
    profileCompleted: boolean;
    city?: string;
    postCount?: number;
    status: 'active' | 'suspended' | 'banned';
    phoneNumber?: string;
    bio?: string;
    birthYear?: number;
}

interface UserStats {
    totalUsers: number;
    adminUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    bannedUsers: number;
    newUsersToday: number;
}

// --- Yeniden Kullanılabilir Bileşenler ---

// Stat Kartı Bileşeni
// Tarih formatlama yardımcı fonksiyonu
const formatDate = (dateValue: string | Date | { seconds: number }): string => {
    try {
        if (!dateValue) return 'Belirtilmemiş';
        
        // Firebase Timestamp objesi ise
        if (dateValue.seconds) {
            return new Date(dateValue.seconds * 1000).toLocaleDateString('tr-TR');
        }
        
        // String veya Date objesi ise
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return 'Geçersiz Tarih';
        }
        return date.toLocaleDateString('tr-TR');
    } catch (error) {
        console.error('Tarih formatlama hatası:', error);
        return 'Geçersiz Tarih';
    }
};

const formatDateTime = (dateValue: unknown): string => {
    try {
        if (!dateValue) return 'Belirtilmemiş';
        
        // Firebase Timestamp objesi ise
        if (dateValue.seconds) {
            return new Date(dateValue.seconds * 1000).toLocaleString('tr-TR');
        }
        
        // String veya Date objesi ise
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return 'Geçersiz Tarih';
        }
        return date.toLocaleString('tr-TR');
    } catch (error) {
        console.error('Tarih formatlama hatası:', error);
        return 'Geçersiz Tarih';
    }
};

const StatCard = ({ icon, title, value, colorClass }: { icon: React.ReactNode; title: string; value: number; colorClass: string }) => (
    <div className={`bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300`}>
        <div className="flex items-center justify-between">
            <div>
                <p className={`text-sm font-semibold ${colorClass}`}>{title}</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
            </div>
            <div className={`p-3 bg-opacity-10 rounded-lg ${colorClass.replace('text-', 'bg-')}`}>
                {icon}
            </div>
        </div>
    </div>
);

// Durum Etiketi Bileşeni
const StatusBadge = ({ status }: { status: 'active' | 'suspended' | 'banned' }) => {
    const statusStyles = {
        active: 'bg-green-100/80 text-green-700 dark:bg-green-500/10 dark:text-green-400',
        suspended: 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
        banned: 'bg-red-100/80 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    };
    const statusText = {
        active: 'Aktif',
        suspended: 'Askıda',
        banned: 'Yasaklı',
    };
    return (
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
            {statusText[status]}
        </span>
    );
};


export default function AdminUsersPage() {
    const { user, loading, firebaseUser } = useAuth();
    const router = useRouter();
    
    // --- State Tanımları (Değişiklik Yok) ---
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    
    // --- Veri Çekme ve Yetki Kontrolü (Değişiklik Yok) ---
    useEffect(() => {
        if (loading) return;
        if (!user || !user.isAdmin) {
            toast.error('Bu alana erişim yetkiniz yok.');
            router.push('/');
            return;
        }
        fetchUsersData();
    }, [user, loading, router]);

    // Dropdown dışına tıklandığında kapatma
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Eğer tıklanan element dropdown menüsü değilse ve açık bir dropdown varsa kapat
            const target = event.target as HTMLElement;
            if (!target.closest('[data-dropdown-menu]') && !target.closest('[data-dropdown-trigger]')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUsersData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/users?userId=${user?.uid}`);
            if (!response.ok) throw new Error('Kullanıcı verileri alınamadı.');
            const data = await response.json();
            setUsers(data.users);
            setStats(data.stats);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Kullanıcı Aksiyonları (Değişiklik Yok) ---
    const handleUserAction = async (userId: string, action: 'promote' | 'demote' | 'suspend' | 'unsuspend' | 'ban' | 'unban') => {
        try {
            if (!firebaseUser) {
                throw new Error('Yetkilendirme hatası: Giriş yapmış kullanıcı bulunamadı.');
            }
            const token = await firebaseUser.getIdToken();

            const response = await fetch(`/api/admin/users/action`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ targetUserId: userId, action })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'İşlem başarısız oldu.');
            }
            
            toast.success(result.message || 'İşlem başarıyla tamamlandı.');
            fetchUsersData(); // Listeyi yenile
            setOpenDropdownId(null); // Dropdown'ı kapat
        } catch (error: any) {
            toast.error(error.message);
        }
    };
    
    // --- Filtreleme Mantığı (Değişiklik Yok) ---
    const filteredUsers = users.filter(u => {
        const matchesSearch = !searchTerm ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || u.status === filterStatus;
        const matchesRole = !filterRole ||
            (filterRole === 'admin' && u.isAdmin) ||
            (filterRole === 'user' && !u.isAdmin);
        return matchesSearch && matchesStatus && matchesRole;
    });
    
    const openUserModal = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    if (loading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <Loader className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }
    
    if (!user || !user.isAdmin) return null;

    // --- MODERN TASARIM JSX ---
    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
            <main className="w-full p-4 md:p-8 max-w-8xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-600" />
                            Kullanıcı Yönetim Paneli
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Platformdaki tüm kullanıcıları görüntüleyin ve yönetin.</p>
                    </div>
                    <button
                        onClick={fetchUsersData}
                        className="mt-4 md:mt-0 p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                    >
                        <RefreshCw className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* İstatistik Kartları */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
                        <StatCard icon={<Users className="h-6 w-6" />} title="Toplam Kullanıcı" value={stats.totalUsers} colorClass="text-blue-600" />
                        <StatCard icon={<Shield className="h-6 w-6" />} title="Yöneticiler" value={stats.adminUsers} colorClass="text-purple-600" />
                        <StatCard icon={<UserCheck className="h-6 w-6" />} title="Aktif" value={stats.activeUsers} colorClass="text-green-600" />
                        <StatCard icon={<Clock className="h-6 w-6" />} title="Askıda" value={stats.suspendedUsers} colorClass="text-yellow-600" />
                        <StatCard icon={<UserX className="h-6 w-6" />} title="Yasaklı" value={stats.bannedUsers} colorClass="text-red-600" />
                        <StatCard icon={<UserPlus className="h-6 w-6" />} title="Bugün Yeni" value={stats.newUsersToday} colorClass="text-indigo-600" />
                    </div>
                )}
                
                {/* Filtreler ve Arama Çubuğu */}
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Email veya ad ile ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                            <option value="">Tüm Durumlar</option>
                            <option value="active">Aktif</option>
                            <option value="suspended">Askıda</option>
                            <option value="banned">Yasaklı</option>
                        </select>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                            <option value="">Tüm Roller</option>
                            <option value="admin">Admin</option>
                            <option value="user">Kullanıcı</option>
                        </select>
                    </div>
                </div>

                {/* Kullanıcılar Tablosu */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Kullanıcı</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Durum</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Rol</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Katılım Tarihi</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">İşlemler</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                                    <span className="text-blue-600 dark:text-blue-400 font-medium text-lg">
                                                        {u.displayName?.[0] || u.email[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{u.displayName || 'İsimsiz'}</div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate" title={u.email}>{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={u.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.isAdmin ? (
                                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100/80 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">Admin</span>
                                            ) : (
                                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">Kullanıcı</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            {formatDate(u.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openUserModal(u)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                                {/* Dropdown Menü */}
                                                <div className="relative">
                                                    <button 
                                                        data-dropdown-trigger
                                                        onClick={() => setOpenDropdownId(openDropdownId === u.id ? null : u.id)}
                                                        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </button>
                                                    
                                                    {openDropdownId === u.id && (
                                                        <div data-dropdown-menu className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 z-10">
                                                            <div className="py-1" role="menu">
                                                                {u.isAdmin ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleUserAction(u.id, 'demote');
                                                                            setOpenDropdownId(null);
                                                                        }}
                                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left"
                                                                    >
                                                                        <Shield className="h-4 w-4" />
                                                                        Admin Yetkisini Kaldır
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleUserAction(u.id, 'promote');
                                                                            setOpenDropdownId(null);
                                                                        }}
                                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left"
                                                                    >
                                                                        <Shield className="h-4 w-4" />
                                                                        Admin Yap
                                                                    </button>
                                                                )}
                                                                
                                                                {u.status === 'active' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => {
                                                                                handleUserAction(u.id, 'suspend');
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left"
                                                                        >
                                                                            <Clock className="h-4 w-4" />
                                                                            Askıya Al
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                handleUserAction(u.id, 'ban');
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left"
                                                                        >
                                                                            <Ban className="h-4 w-4" />
                                                                            Yasakla
                                                                        </button>
                                                                    </>
                                                                )}
                                                                
                                                                {u.status === 'suspended' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleUserAction(u.id, 'unsuspend');
                                                                            setOpenDropdownId(null);
                                                                        }}
                                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                        Askıyı Kaldır
                                                                    </button>
                                                                )}
                                                                
                                                                {u.status === 'banned' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleUserAction(u.id, 'unban');
                                                                            setOpenDropdownId(null);
                                                                        }}
                                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left"
                                                                    >
                                                                        <Unlock className="h-4 w-4" />
                                                                        Yasağı Kaldır
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                                <Search className="h-10 w-10 text-slate-400" />
                                                <span className="font-medium">Sonuç Bulunamadı</span>
                                                <p className="text-sm">Filtre kriterlerinizi değiştirmeyi deneyin.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            
            {/* Modal (Görünüm İyileştirildi) */}
            {/* Modal bileşeninizin `isOpen` ve `onClose` prop'larını aldığını varsayıyorum. */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                         <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kullanıcı Detayları</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.displayName || selectedUser.email}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <XCircle className="h-6 w-6 text-slate-500" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 mt-0.5 text-slate-400"/>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500">EMAIL</label>
                                            <p className="text-slate-800 dark:text-slate-200 truncate" title={selectedUser.email}>{selectedUser.email}</p>
                                        </div>
                                    </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 mt-0.5 text-slate-400"/>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500">TELEFON</label>
                                        <p className="text-slate-800 dark:text-slate-200">{selectedUser.phoneNumber || 'Belirtilmemiş'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 mt-0.5 text-slate-400"/>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500">ŞEHİR</label>
                                        <p className="text-slate-800 dark:text-slate-200">{selectedUser.city || 'Belirtilmemiş'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 mt-0.5 text-slate-400"/>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500">KAYIT TARİHİ</label>
                                        <p className="text-slate-800 dark:text-slate-200">{formatDateTime(selectedUser.createdAt)}</p>
                                    </div>
                                </div>
                                 <div className="flex items-start gap-3 col-span-full">
                                    <Lock className="h-5 w-5 mt-0.5 text-slate-400"/>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500">SON GİRİŞ</label>
                                        <p className="text-slate-800 dark:text-slate-200">{selectedUser.lastLoginAt ? formatDateTime(selectedUser.lastLoginAt) : 'Giriş yapılmamış'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 col-span-full">
                                    <FileText className="h-5 w-5 mt-0.5 text-slate-400"/>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500">BİYOGRAFİ</label>
                                        <p className="text-slate-800 dark:text-slate-200 text-sm">{selectedUser.bio || 'Belirtilmemiş'}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Modal içindeki aksiyon butonları da buraya eklenebilir */}
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}