'use client';

import { useEffect, useState, Fragment, useCallback } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
    CheckCircle, XCircle, Search, Inbox,
    FileText, Eye, ShieldCheck, ShieldOff, Flag, Users, Clock, Calendar
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

interface Report {
    id: string;
    postId?: string;
    reportedBy: string;
    reason: 'spam' | 'inappropriate' | 'misleading' | 'other';
    description?: string;
    createdAt: string;
    status: 'pending' | 'resolved' | 'dismissed';
    postTitle?: string;
    postContent?: string;
    postAuthorName?: string;
    postAuthorEmail?: string;
    reporterName?: string;
    reporterEmail?: string;
    type?: 'post' | 'user';
}

const reasonConfig = {
    spam: { label: 'Spam', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
    inappropriate: { label: 'Uygunsuz', color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
    misleading: { label: 'Yanıltıcı', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
    other: { label: 'Diğer', color: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' },
};

const statusConfig = {
    pending: { label: 'Bekliyor', color: 'text-yellow-400', icon: <Clock className="w-4 h-4" /> },
    resolved: { label: 'Çözüldü', color: 'text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
    dismissed: { label: 'Reddedildi', color: 'text-gray-500', icon: <XCircle className="w-4 h-4" /> },
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function AdminReportsPage() {
    const { user, firebaseUser, loading } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', reason: '', search: '' });
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const router = useRouter();

    const fetchReports = useCallback(async () => {
        if (!firebaseUser) return;
        setIsLoading(true);
        try {
            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/admin/reports', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Raporlar yüklenemedi.');
            const data = await response.json();
            setReports(data.reports || []);
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred while fetching reports.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [firebaseUser]);

    useEffect(() => {
        if (loading) return;
        if (!user || !user.isAdmin) {
            toast.error('Bu sayfaya erişim yetkiniz yok.');
            router.push('/');
            return;
        }
        if (firebaseUser) fetchReports();
    }, [user, firebaseUser, loading, router, fetchReports]);


    const handleAction = async (reportId: string, action: 'resolved' | 'dismissed') => {
        if (!firebaseUser) return;
        try {
            const token = await firebaseUser.getIdToken();
            const response = await fetch(`/api/admin/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action }),
            });
            if (!response.ok) throw new Error('İşlem başarısız.');
            const updatedReport = await response.json();
            setReports(prev => prev.map(r => r.id === reportId ? updatedReport.report : r));
            setSelectedReport(updatedReport.report);
            toast.success(`Rapor ${action === 'resolved' ? 'çözüldü' : 'reddedildi'} olarak işaretlendi.`);
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred while handling the report action.");
            }
        }
    };

    const filteredReports = reports.filter(report =>
        (!filters.status || report.status === filters.status) &&
        (!filters.reason || report.reason === filters.reason) &&
        (!filters.search ||
            report.postTitle?.toLowerCase().includes(filters.search.toLowerCase()) ||
            report.reporterName?.toLowerCase().includes(filters.search.toLowerCase()) ||
            report.postAuthorName?.toLowerCase().includes(filters.search.toLowerCase())
        )
    );

    if (loading || (isLoading && reports.length === 0)) {
        return <div className="flex h-full items-center justify-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;
    }

    return (
        <div className="bg-slate-900 min-h-full font-sans text-slate-300 p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                    <Flag className="w-8 h-8 text-blue-500" />
                    Rapor Merkezi
                </h1>
                <p className="mt-1 text-md text-slate-400">Kullanıcı tarafından gönderilen raporları yönetin ve takip edin.</p>
            </header>

            <div className="bg-slate-800/50 rounded-xl border border-slate-800">
                <div className="p-4 sm:p-6 border-b border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Başlık, raporlayan, gönderen..."
                                value={filters.search}
                                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                className="w-full pl-11 pr-4 py-2.5 border border-slate-600 bg-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition text-slate-200"
                            />
                        </div>
                        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-600 bg-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition text-slate-200 appearance-none">
                            <option value="">Tüm Durumlar</option>
                            {Object.entries(statusConfig).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                        <select value={filters.reason} onChange={e => setFilters(f => ({ ...f, reason: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-600 bg-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition text-slate-200 appearance-none">
                            <option value="">Tüm Nedenler</option>
                            {Object.entries(reasonConfig).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-800 text-xs text-slate-400 uppercase font-semibold">
                            <tr>
                                <th scope="col" className="px-6 py-4">Durum</th>
                                <th scope="col" className="px-6 py-4">Rapor Konusu</th>
                                <th scope="col" className="px-6 py-4">Neden</th>
                                <th scope="col" className="px-6 py-4">Raporlayan</th>
                                <th scope="col" className="px-6 py-4">Tarih</th>
                                <th scope="col" className="px-6 py-4 text-right">Eylemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredReports.length > 0 ? filteredReports.map(report => (
                                <tr key={report.id} className="hover:bg-slate-800/60 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-2 font-medium ${statusConfig[report.status].color}`}>
                                            {statusConfig[report.status].icon}
                                            {statusConfig[report.status].label}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-200">{report.postTitle || 'Kullanıcı Raporu'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${reasonConfig[report.reason].color}`}>{reasonConfig[report.reason].label}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{report.reporterName || 'Bilinmiyor'}</td>
                                    <td className="px-6 py-4 text-slate-400">{formatDate(report.createdAt)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setSelectedReport(report)} className="font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 ml-auto p-2 rounded-md hover:bg-blue-500/10">
                                            <Eye size={16} /> Detaylar
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-16">
                                        <Inbox size={48} className="mx-auto text-slate-500" />
                                        <h3 className="mt-4 text-lg font-semibold text-slate-300">Rapor bulunamadı</h3>
                                        <p className="mt-1 text-slate-500">Filtrelerinizi değiştirin veya yeni raporları bekleyin.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Transition.Root show={selectedReport !== null} as={Fragment}>
                <Dialog as="div" className="relative z-50 font-sans" onClose={() => setSelectedReport(null)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 p-6 text-left align-middle shadow-2xl transition-all">
                                    {selectedReport && (
                                        <>
                                            <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-100 border-b border-slate-700 pb-4 mb-6 flex items-center gap-3">
                                                <FileText /> Rapor Detayları
                                            </Dialog.Title>
                                            <div className="space-y-5 text-sm">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="flex items-start gap-3">
                                                        <Users className="w-5 h-5 mt-0.5 text-slate-400" />
                                                        <div>
                                                            <h4 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Raporlayan</h4>
                                                            <p className="text-slate-200 mt-1">{selectedReport.reporterName} ({selectedReport.reporterEmail})</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <Calendar className="w-5 h-5 mt-0.5 text-slate-400" />
                                                        <div>
                                                            <h4 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Tarih</h4>
                                                            <p className="text-slate-200 mt-1">{formatDate(selectedReport.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-400 uppercase text-xs tracking-wider mb-2">Rapor Açıklaması</h4>
                                                    <p className="text-slate-300 bg-slate-700/50 p-4 rounded-lg border border-slate-700">{selectedReport.description || 'Ek açıklama yok.'}</p>
                                                </div>
                                                {selectedReport.postContent && (
                                                    <div>
                                                        <h4 className="font-semibold text-slate-400 uppercase text-xs tracking-wider mb-2">İlgili Gönderi İçeriği</h4>
                                                        <p className="text-slate-300 bg-slate-700/50 p-4 rounded-lg border border-slate-700 max-h-40 overflow-y-auto">{selectedReport.postContent}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {selectedReport.status === 'pending' && (
                                                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-700">
                                                    <button onClick={() => handleAction(selectedReport.id, 'resolved')} className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 transform hover:-translate-y-0.5">
                                                        <ShieldCheck size={18} /> Çözüldü
                                                    </button>
                                                    <button onClick={() => handleAction(selectedReport.id, 'dismissed')} className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg shadow-slate-600/10 hover:shadow-slate-600/20 transform hover:-translate-y-0.5">
                                                        <ShieldOff size={18} /> Reddet
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    );
}