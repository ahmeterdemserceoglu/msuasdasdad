'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { useRouter } from 'next/navigation';
import XLayout from '@/app/components/layout/XLayout';
import { Bell, Heart, MessageCircle, UserPlus, CheckCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'post_approved';
  title: string;
  message: string;
  postId?: string;
  fromUserId?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { firebaseUser, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth yüklenene kadar bekle
    if (authLoading) return;
    
    // Auth yüklendikten sonra user yoksa login'e yönlendir
    if (!user) {
      router.push('/login');
      return;
    }

    fetchNotifications();
  }, [user, authLoading, router]);

  const fetchNotifications = async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Bildirimler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        toast.success('Tüm bildirimler okundu olarak işaretlendi');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('İşlem başarısız oldu');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        toast.success('Bildirim silindi');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Bildirim silinemedi');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'post_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.postId) {
      router.push(`/posts/${notification.postId}`);
    }
  };

  // Auth yüklenene kadar loading göster
  if (authLoading) {
    return (
      <XLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        </div>
      </XLayout>
    );
  }

  return (
    <XLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Bildirimler</h1>
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Tümünü okundu işaretle
            </button>
          )}
        </div>
      </header>

      {/* Notifications List */}
      <div className="divide-y divide-[var(--border)]">
        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
            <p className="text-[var(--muted)] mt-4">Yükleniyor...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Henüz bildiriminiz yok</h2>
            <p className="text-[var(--muted)]">
              Diğer kullanıcılar gönderilerinizi beğendiğinde veya yorum yaptığında burada görünecek.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-[var(--card-hover)] transition-colors cursor-pointer relative ${
                !notification.read ? 'bg-[var(--primary-light)]' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {notification.title}
                  </p>
                  <p className="text-sm text-[var(--muted)] mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-2">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-[var(--card-hover)] rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--muted)]" />
                </button>
              </div>
              {!notification.read && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-[var(--primary)] rounded-full"></div>
              )}
            </div>
          ))
        )}
      </div>
    </XLayout>
  );
}
