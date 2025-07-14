import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth-context';

interface AdminNotification {
    id: string;
    type: 'pending_post' | 'new_user' | 'reported_content';
    count: number;
    message: string;
    timestamp: string;
}

export function useAdminNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user?.isAdmin) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/notifications?userId=${user.uid}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setTotalCount(data.totalCount || 0);
            }
        } catch (error) {
            console.error('Bildirimler alınamadı:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.isAdmin]);

    useEffect(() => {
        if (user?.isAdmin) {
            fetchNotifications();
            // Her 30 saniyede bir bildirimları güncelle
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.isAdmin, fetchNotifications]);

    return {
        notifications,
        totalCount,
        loading,
        refresh: fetchNotifications
    };
}
