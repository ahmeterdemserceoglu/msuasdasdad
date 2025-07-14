import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';

// Bu fonksiyon, bir kullanıcının admin olup olmadığını kontrol eder.
async function isAdmin(userId: string): Promise<boolean> {
    try {
        const userDocRef = adminDb.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (userDoc.exists && userDoc.data()?.isAdmin === true) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

export async function GET(req: NextRequest) {
    try {
        // Token doğrulaması yap
        const authResult = await verifyAuth(req);
        
        if (!authResult.authenticated) {
            return NextResponse.json(
                { error: authResult.error || 'Yetkisiz erişim' },
                { status: 401 }
            );
        }

        const userId = authResult.userId!;

        // Kullanıcının admin yetkisi olup olmadığını kontrol et
        const userIsAdmin = await isAdmin(userId);
        if (!userIsAdmin) {
            return new NextResponse(JSON.stringify({ error: 'Yetkisiz erişim.' }), { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range') || '7d';

        // Gerçek veriler için Firebase'den istatistikleri al
        const [postsSnapshot, usersSnapshot] = await Promise.all([
            adminDb.collection('posts').get(),
            adminDb.collection('users').get()
        ]);

        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Tarih aralığına göre filtrele
        const now = new Date();
        let startDate: Date;
        
        switch (range) {
            case '1d':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Filtrelenmiş veriler
        const recentPosts = posts.filter(post => {
            const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
            return createdAt >= startDate;
        });

        const recentUsers = users.filter(user => {
            const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
            return createdAt >= startDate;
        });

        // İstatistikleri hesapla
        const approvedPosts = posts.filter(post => post.status === 'approved');
        const pendingPosts = posts.filter(post => post.status === 'pending');
        const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

        // Mock data ile birleştir (gerçek bir uygulamada bu veriler database'den gelir)
        const analyticsData = {
            pageViews: {
                total: 45230 + (recentPosts.length * 50),
                today: 1250 + (recentPosts.length * 5),
                thisWeek: 8750 + (recentPosts.length * 25),
                thisMonth: 28400 + (recentPosts.length * 100),
                trend: Math.random() > 0.5 ? 12.5 : -5.2
            },
            users: {
                total: users.length,
                active: Math.floor(users.length * 0.6),
                new: recentUsers.length,
                returning: Math.floor(users.length * 0.4),
                trend: recentUsers.length > 0 ? 8.3 : -2.1
            },
            posts: {
                total: posts.length,
                published: approvedPosts.length,
                pending: pendingPosts.length,
                views: posts.reduce((sum, post) => sum + (post.views || 0), 0),
                trend: recentPosts.length > 0 ? 15.7 : -3.2
            },
            engagement: {
                likes: totalLikes,
                comments: totalComments,
                shares: Math.floor(totalLikes * 0.3),
                avgTimeOnSite: "3m 45s",
                bounceRate: 35.2
            },
            traffic: {
                sources: [
                    { name: "Organik Arama", visitors: 18540, percentage: 41.0 },
                    { name: "Doğrudan Trafik", visitors: 12380, percentage: 27.4 },
                    { name: "Sosyal Medya", visitors: 8220, percentage: 18.2 },
                    { name: "Referans", visitors: 4650, percentage: 10.3 },
                    { name: "Email", visitors: 1440, percentage: 3.1 }
                ],
                topPages: [
                    { path: "/", views: 8540, uniqueViews: 6220 },
                    { path: "/posts", views: 6780, uniqueViews: 5130 },
                    { path: "/about", views: 4320, uniqueViews: 3890 },
                    { path: "/contact", views: 2890, uniqueViews: 2650 },
                    { path: "/profile", views: 2340, uniqueViews: 1980 }
                ]
            },
            performance: {
                avgLoadTime: 1240,
                serverUptime: 99.8,
                errorRate: 0.2,
                apiResponseTime: 85
            }
        };

        return NextResponse.json(analyticsData, { status: 200 });
    } catch (error) {
        console.error("Error fetching analytics: ", error);
        return new NextResponse(JSON.stringify({ error: 'Sunucu hatası.' }), { status: 500 });
    }
}
