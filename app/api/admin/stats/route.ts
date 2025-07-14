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

        // Tüm gönderileri al
        const postsSnapshot = await db.collection('posts').get();
        const posts: Post[] = postsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                userName: data.userName,
                userPhotoURL: data.userPhotoURL,
                title: data.title,
                summary: data.summary,
                content: data.content,
                interviewType: data.interviewType,
                candidateType: data.candidateType,
                experienceDate: data.experienceDate?.toDate?.() || new Date(),
                city: data.city || null,
                tags: data.tags || [],
                likes: data.likes || [],
                likeCount: data.likeCount || 0,
                commentCount: data.commentCount || 0,
                isApproved: data.isApproved || false,
                status: data.status || 'pending',
                rejectionReason: data.rejectionReason || null,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
            };
        });

        // Tüm kullanıcıları al
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                isAdmin: data.isAdmin || false,
                lastLoginAt: data.lastLoginAt?.toDate?.() || null,
                createdAt: data.createdAt?.toDate?.() || new Date()
            };
        });

        // İstatistikleri hesapla
        const stats = {
            totalPosts: posts.length,
            pendingPosts: posts.filter(p => p.status === 'pending').length,
            approvedPosts: posts.filter(p => p.status === 'approved').length,
            rejectedPosts: posts.filter(p => p.status === 'rejected').length,
            totalUsers: users.length,
            todayPosts: posts.filter(p => {
                const postDate = new Date(p.createdAt);
                return postDate >= todayStart;
            }).length,
            adminUsers: users.filter(u => u.isAdmin).length,
            activeUsers: users.filter(u => {
                const lastActive = new Date(u.lastLoginAt || u.createdAt);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return lastActive >= thirtyDaysAgo;
            }).length,
            thisWeekPosts: posts.filter(p => {
                const postDate = new Date(p.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return postDate >= weekAgo;
            }).length,
            thisMonthPosts: posts.filter(p => {
                const postDate = new Date(p.createdAt);
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return postDate >= monthAgo;
            }).length,
            averagePostsPerUser: users.length > 0 ? Math.round(posts.length / users.length * 100) / 100 : 0,
            totalLikes: posts.reduce((sum, post) => sum + (post.likes || 0), 0),
            mostActiveCity: getMostActiveCity(posts),
            mostUsedCategory: getMostUsedCategory(posts)
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('İstatistik alma hatası:', error);
        return NextResponse.json(
            { error: 'İstatistikler alınırken bir hata oluştu.' },
            { status: 500 }
        );
    }
}

function getMostActiveCity(posts: Post[]) {
    const cityCounts: Record<string, number> = posts.reduce((acc, post) => {
        if (post.city) {
            acc[post.city] = (acc[post.city] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(cityCounts);
    if (entries.length === 0) return 'Belirtilmemiş';

    const [city, count] = entries.reduce((max, current) => 
        (current[1] as number) > (max[1] as number) ? current : max
    );

    return `${city} (${count})`;
}

function getMostUsedCategory(posts: Post[]) {
    const categoryCounts: Record<string, number> = posts.reduce((acc, post) => {
        if (post.category) {
            acc[post.category] = (acc[post.category] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(categoryCounts);
    if (entries.length === 0) return 'Belirtilmemiş';

    const [category, count] = entries.reduce((max, current) => 
        (current[1] as number) > (max[1] as number) ? current : max
    );

    return `${category} (${count})`;
}
