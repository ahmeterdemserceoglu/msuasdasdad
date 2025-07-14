import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkDailyPostLimit, incrementUserPostCount } from '@/app/lib/post-limits';

// Bu fonksiyonun ismini 'handler' olarak değiştirmekten kaçının.
// Next.js App Router'da, HTTP metotlarına karşılık gelen (GET, POST, vb.)
// isimlendirilmiş export'lar kullanılır.
export async function POST(req: NextRequest) {
    try {
        // Get authorization token
        const authorization = req.headers.get('authorization');
        if (!authorization) {
            return new NextResponse(JSON.stringify({ error: 'Yetkilendirme başlığı eksik.' }), { status: 401 });
        }

        const token = authorization.split('Bearer ')[1];
        if (!token) {
            return new NextResponse(JSON.stringify({ error: 'Geçersiz token formatı.' }), { status: 401 });
        }

        // Verify token and get user
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (error) {
            console.error('Token verification error:', error);
            return new NextResponse(JSON.stringify({ error: 'Geçersiz veya süresi dolmuş token.' }), { status: 401 });
        }

        const userId = decodedToken.uid;

        const { 
            title, 
            content, 
            summary, 
            interviewType, 
            candidateType, 
            experienceDate, 
            city, 
            tags,
            postType
        } = await req.json();

        // For simple content posts (from homepage)
        if (!content || content.trim() === '') {
            return new NextResponse(JSON.stringify({ error: 'İçerik boş olamaz.' }), { status: 400 });
        }

        // Check daily post limit
        const { canPost, remainingPosts, postsToday } = await checkDailyPostLimit(userId);
        
        if (!canPost) {
            return new NextResponse(JSON.stringify({ 
                error: 'Günlük paylaşım limitinize ulaştınız. Yarın tekrar deneyebilirsiniz.',
                remainingPosts: 0,
                postsToday 
            }), { status: 429 });
        }

        // Create the post with all fields
        // For simple posts from homepage, use default values
        const postData = {
            title: title || content.substring(0, 50) + '...', // Use first 50 chars as title if not provided
            content,
            summary: summary || '',
            interviewType: interviewType || 'genel', // Default to 'genel'
            candidateType: candidateType || 'diger', // Default to 'diger'
            experienceDate: experienceDate || new Date().toISOString(),
            city: city || 'Belirtilmemiş',
            tags: tags || [],
            postType: postType || 'deneyim', // Default to 'deneyim' if not provided
            userId,
            createdAt: FieldValue.serverTimestamp(),
            likes: 0,
            likedBy: [],
            commentCount: 0,
            likes: 0, // Ensure likes is initialized to 0
            status: 'pending',
            isApproved: false
        };
        
        const docRef = await adminDb.collection('posts').add(postData);

        // Ayrıca user tablosuna da post alt koleksiyonu olarak kaydet
        try {
            await adminDb.collection('users').doc(userId).collection('posts').add({
                postId: docRef.id,
                ...postData,
                createdAt: FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('User posts alt koleksiyonuna kayıt hatası:', error);
        }

        // Increment the user's post count for today
        const incrementSuccess = await incrementUserPostCount(userId);
        if (!incrementSuccess) {
            console.error('Failed to increment user post count');
            // Note: We don't fail the request here since the post was created
        }

        return new NextResponse(JSON.stringify({ 
            id: docRef.id,
            remainingPosts: remainingPosts - 1,
            postsToday: postsToday + 1
        }), { status: 201 });
    } catch (error) {
        console.error("Error creating post: ", error);
        return new NextResponse(JSON.stringify({ error: 'Sunucu hatası.' }), { status: 500 });
    }
}

// Postları getir (Feed için)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get('limit') || '10';
        const status = searchParams.get('status') || 'approved';
        
        // Onaylanmış postları getir
        let postsQuery = adminDb.collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(parseInt(limitParam));
        
        // Eğer belirli bir status isteniyorsa filtrele
        if (status !== 'all') {
            postsQuery = postsQuery.where('status', '==', status);
        }
        
        const postsSnapshot = await postsQuery.get();
        const posts = [];
        
        for (const postDoc of postsSnapshot.docs) {
            const postData = postDoc.data();
            
            // Kullanıcı bilgilerini getir
            try {
                const userDoc = await adminDb.collection('users').doc(postData.userId).get();
                const userData = userDoc.data();
                
                // Yorum sayısını hesapla
                const commentsSnapshot = await adminDb
                    .collection('posts')
                    .doc(postDoc.id)
                    .collection('comments')
                    .get();
                const commentCount = commentsSnapshot.size;
                
                posts.push({
                    id: postDoc.id,
                    ...postData,
                    userId: postData.userId,
                    userName: userData?.displayName || 'Anonim Kullanıcı',
                    userPhotoURL: userData?.photoURL || null,
                    commentCount: commentCount,
                    viewCount: postData.viewCount || 0,
                    createdAt: postData.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                    experienceDate: postData.experienceDate || new Date().toISOString()
                });
            } catch (userError) {
                console.error('User data fetch error:', userError);
                // Kullanıcı bilgisi alınamazsa default değerlerle ekle
                posts.push({
                    id: postDoc.id,
                    ...postData,
                    userId: postData.userId,
                    userName: 'Anonim Kullanıcı',
                    userPhotoURL: null,
                    commentCount: 0,
                    viewCount: postData.viewCount || 0,
                    createdAt: postData.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
                    experienceDate: postData.experienceDate || new Date().toISOString()
                });
            }
        }
        
        return new NextResponse(JSON.stringify({ posts }), { status: 200 });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return new NextResponse(JSON.stringify({ error: 'Postlar alınırken hata oluştu.' }), { status: 500 });
    }
}
