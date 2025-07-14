import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { checkAdminAuth } from '@/app/lib/admin-utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Kullanıcı ID gerekli.' },
                { status: 400 }
            );
        }

        // Admin yetkisi kontrolü
        const adminCheck = await checkAdminAuth(userId);
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { error: 'Bu işlem için yetkiniz yok.' },
                { status: 403 }
            );
        }

        // Bugünün başlangıcını hesapla
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Tüm kullanıcıları al
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Tarih alanlarını güvenli bir şekilde ISO string formatına çevir
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
            const lastLoginAt = data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : data.lastLoginAt;

            return {
                id: doc.id,
                email: data.email,
                displayName: data.displayName,
                isAdmin: data.isAdmin || false,
                createdAt: createdAt,
                lastLoginAt: lastLoginAt,
                profileCompleted: data.profileCompleted || false,
                city: data.city,
                status: data.status || 'active',
                phoneNumber: data.phoneNumber,
                bio: data.bio,
                postCount: 0 // Bu ayrıca hesaplanacak
            };
        });

        // Her kullanıcının gönderi sayısını hesapla
        const postsSnapshot = await db.collection('posts').get();
        const postsByUser = postsSnapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            acc[data.userId] = (acc[data.userId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Kullanıcıları güncelle
        const usersWithPostCount = users.map(user => ({
            ...user,
            postCount: postsByUser[user.id] || 0
        }));

        // İstatistikleri hesapla
        const stats = {
            totalUsers: users.length,
            adminUsers: users.filter(u => u.isAdmin).length,
            activeUsers: users.filter(u => u.status === 'active').length,
            suspendedUsers: users.filter(u => u.status === 'suspended').length,
            bannedUsers: users.filter(u => u.status === 'banned').length,
            newUsersToday: users.filter(u => {
                const userDate = new Date(u.createdAt);
                return userDate >= todayStart;
            }).length
        };

        return NextResponse.json({
            users: usersWithPostCount,
            stats
        });

    } catch (error) {
        console.error('Kullanıcı verisi alma hatası:', error);
        return NextResponse.json(
            { error: 'Kullanıcı verileri alınırken bir hata oluştu.' },
            { status: 500 }
        );
    }
}
