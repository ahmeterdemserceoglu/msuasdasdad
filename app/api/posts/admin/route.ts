import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';

// Bu fonksiyon, bir kullanıcının admin olup olmadığını kontrol eder.
// Firebase Admin SDK kullanarak güvenli bir şekilde doğrulama yapılır.
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

        // URL'den status parametresini al
        const { searchParams } = new URL(req.url);
        const statusFilter = searchParams.get('status');
        
        let postsQuery = adminDb.collection('posts').orderBy('createdAt', 'desc');
        
        // Status filtresi varsa uygula
        if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
            postsQuery = postsQuery.where('status', '==', statusFilter);
        }
        
        const querySnapshot = await postsQuery.get();

        // Tüm postları kullanıcı bilgileriyle birlikte getir
        const posts = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
                const postData = doc.data();
                let userName = 'Bilinmeyen Kullanıcı';
                let userEmail = '';
                
                // Kullanıcı bilgilerini getir
                if (postData.userId) {
                    try {
                        const userDoc = await adminDb.collection('users').doc(postData.userId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            userName = userData?.displayName || userData?.name || 'Anonim Kullanıcı';
                            userEmail = userData?.email || '';
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                    }
                }
                
                return {
                    id: doc.id,
                    ...postData,
                    userName,
                    userEmail,
                    displayName: userName,
                    // Timestamp'i JSON uyumlu bir formata dönüştür
                    createdAt: postData?.createdAt?.toDate?.() ? postData.createdAt.toDate().toISOString() : postData.createdAt,
                };
            })
        );

        // İstatistikleri hesapla
        const stats = {
            total: posts.length,
            pending: posts.filter(p => p.status === 'pending').length,
            approved: posts.filter(p => p.status === 'approved').length,
            rejected: posts.filter(p => p.status === 'rejected').length
        };

        return NextResponse.json({ posts, stats }, { status: 200 });
    } catch (error) {
        console.error("Error fetching posts for admin: ", error);
        return new NextResponse(JSON.stringify({ error: 'Sunucu hatası.' }), { status: 500 });
    }
} 