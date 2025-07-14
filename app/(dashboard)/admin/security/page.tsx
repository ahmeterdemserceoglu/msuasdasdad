'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { Shield, AlertTriangle, Info, CheckCircle, User, Calendar, MapPin, Activity, Search, Download } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Select from '@/app/components/ui/Select';

interface SecurityLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  action: string;
  type: 'login' | 'logout' | 'failed_login' | 'admin_action' | 'content_action' | 'security_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  metadata?: Record<string, any>;
}

const SecurityLogsPage = () => {
  const { firebaseUser: currentUser } = useAuth();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  const fetchSecurityLogs = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/admin/security-logs', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        console.error('Failed to fetch security logs');
      }
    } catch (error: Error) {
      console.error('Error fetching security logs:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSecurityLogs();
  }, [fetchSecurityLogs]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);
    
    const matchesType = filterType === '' || log.type === filterType;
    const matchesSeverity = filterSeverity === '' || log.severity === filterSeverity;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'logout':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'failed_login':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'admin_action':
        return <Shield className="w-4 h-4 text-purple-500" />;
      case 'content_action':
        return <Activity className="w-4 h-4 text-orange-500" />;
      case 'security_violation':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Tarih,Kullanıcı,Email,İşlem,Tip,Seviye,Açıklama,IP Adresi,Konum\n" +
      filteredLogs.map(log => 
        `"${formatDate(log.timestamp)}","${log.userDisplayName}","${log.userEmail}","${log.action}","${log.type}","${log.severity}","${log.description}","${log.ipAddress}","${log.location || 'Bilinmiyor'}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Güvenlik Logları
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Sistem güvenlik olayları ve kullanıcı aktiviteleri
                </p>
              </div>
            </div>
            <Button
              onClick={exportLogs}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4" />
              Dışa Aktar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Log</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Kritik Olaylar</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {logs.filter(log => log.severity === 'critical').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Başarısız Girişler</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {logs.filter(log => log.type === 'failed_login').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin İşlemleri</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {logs.filter(log => log.type === 'admin_action').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kullanıcı, email, IP adresi veya işlem ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="w-full lg:w-48">
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { value: '', label: 'Tüm Tipler' },
                  { value: 'login', label: 'Giriş' },
                  { value: 'logout', label: 'Çıkış' },
                  { value: 'failed_login', label: 'Başarısız Giriş' },
                  { value: 'admin_action', label: 'Admin İşlemi' },
                  { value: 'content_action', label: 'İçerik İşlemi' },
                  { value: 'security_violation', label: 'Güvenlik İhlali' }
                ]}
              />
            </div>
            <div className="w-full lg:w-48">
              <Select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                options={[
                  { value: '', label: 'Tüm Seviyeler' },
                  { value: 'low', label: 'Düşük' },
                  { value: 'medium', label: 'Orta' },
                  { value: 'high', label: 'Yüksek' },
                  { value: 'critical', label: 'Kritik' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || filterType || filterSeverity ? 'Filtreye uygun log bulunamadı' : 'Henüz güvenlik logu yok'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterType || filterSeverity ? 'Farklı filtreler deneyin.' : 'Sistem aktiviteleri burada görünecek.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedLogs.map((log) => (
              <div key={log.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(log.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {log.action}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                          {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {log.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{log.userDisplayName} ({log.userEmail})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{log.ipAddress}</span>
                        </div>
                        {log.location && (
                          <div className="flex items-center gap-1">
                            <span>{log.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Önceki
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sayfa {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityLogsPage;
