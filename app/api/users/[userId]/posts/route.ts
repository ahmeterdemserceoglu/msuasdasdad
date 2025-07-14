import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get user's approved posts
    const postsSnapshot = await adminDb.collection('posts')
      .where('userId', '==', userId)
      .where('status', '==', 'approved')
      .orderBy('createdAt', 'desc')
      .get();

    const posts = [];

    for (const doc of postsSnapshot.docs) {
      const postData = doc.data();
      
      // Get user data
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      // Get likes count
      const likesSnapshot = await adminDb
        .collection('posts')
        .doc(doc.id)
        .collection('likes')
        .get();
      const likesCount = likesSnapshot.size;

      // Get comments count
      const commentsSnapshot = await adminDb
        .collection('posts')
        .doc(doc.id)
        .collection('comments')
        .get();
      const commentsCount = commentsSnapshot.size;
      
      posts.push({
        id: doc.id,
        ...postData,
        userName: userData?.displayName || 'Anonim Kullanıcı',
        userPhotoURL: userData?.photoURL || null,
        likes: likesCount,
        commentCount: commentsCount,
        viewCount: postData.viewCount || 0,
        createdAt: postData.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        experienceDate: postData.experienceDate || new Date().toISOString()
      });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json({ error: 'Paylaşımlar alınırken hata oluştu' }, { status: 500 });
  }
}
