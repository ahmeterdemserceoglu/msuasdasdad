'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { BarChart3, TrendingUp, Users, Eye, MessageSquare, ThumbsUp, Globe, Clock, Activity } from 'lucide-react';

interface AnalyticsData {
  pageViews: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
    returning: number;
    trend: number;
  };
  posts: {
    total: number;
    published: number;
    pending: number;
    views: number;
    trend: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    avgTimeOnSite: string;
    bounceRate: number;
  };
  traffic: {
    sources: Array<{
      name: string;
      visitors: number;
      percentage: number;
    }>;
    topPages: Array<{
      path: string;
      views: number;
      uniqueViews: number;
    }>;
  };
  performance: {
    avgLoadTime: number;
    serverUptime: number;
    errorRate: number;
    apiResponseTime: number;
  };
}

const AnalyticsPage = () => {
  const { firebaseUser: currentUser } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentUser) return;
      
      try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          console.error('Failed to fetch analytics');
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [currentUser, timeRange]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↗';
    if (trend < 0) return '↘';
    return '→';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Analitik Verileri Yüklenemedi
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Lütfen daha sonra tekrar deneyin.
          </p>
        </div>
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
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Site Trafiği & Analitik
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Detaylı site performansı ve kullanıcı analitikleri
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="1d">Son 24 Saat</option>
                <option value="7d">Son 7 Gün</option>
                <option value="30d">Son 30 Gün</option>
                <option value="90d">Son 90 Gün</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Görüntülenme</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(analytics.pageViews.total)}
                </p>
                <p className={`text-sm ${getTrendColor(analytics.pageViews.trend)}`}>
                  {getTrendIcon(analytics.pageViews.trend)} {Math.abs(analytics.pageViews.trend)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(analytics.users.total)}
                </p>
                <p className={`text-sm ${getTrendColor(analytics.users.trend)}`}>
                  {getTrendIcon(analytics.users.trend)} {Math.abs(analytics.users.trend)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Gönderi</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(analytics.posts.total)}
                </p>
                <p className={`text-sm ${getTrendColor(analytics.posts.trend)}`}>
                  {getTrendIcon(analytics.posts.trend)} {Math.abs(analytics.posts.trend)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Beğeni</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(analytics.engagement.likes)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  +{analytics.engagement.comments} yorum
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Traffic Sources */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Trafik Kaynakları
            </h3>
            <div className="space-y-4">
              {analytics.traffic.sources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {source.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatNumber(source.visitors)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {source.percentage}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Pages */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              En Popüler Sayfalar
            </h3>
            <div className="space-y-4">
              {analytics.traffic.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {page.path}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {page.uniqueViews} benzersiz görüntülenme
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatNumber(page.views)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Ortalama Yükleme Süresi
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.performance.avgLoadTime}ms
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-green-500" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Sunucu Uptime
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.performance.serverUptime}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Hata Oranı
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.performance.errorRate}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                API Yanıt Süresi
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.performance.apiResponseTime}ms
            </p>
          </div>
        </div>

        {/* Engagement Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kullanıcı Etkileşimi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.engagement.avgTimeOnSite}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ortalama Site Süresi
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.engagement.bounceRate}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Çıkış Oranı
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(analytics.engagement.likes)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toplam Beğeni
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(analytics.engagement.comments)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toplam Yorum
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;