import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { Post } from '@/app/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Check if user exists
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit') || '12';
    const startAfterParam = searchParams.get('startAfter');
    const limit = parseInt(limitParam);

    // Get liked posts from user's likes subcollection
    let likesQuery = adminDb
      .collection('users')
      .doc(userId)
      .collection('likes')
      .orderBy('likedAt', 'desc')
      .limit(limit);

    if (startAfterParam) {
      const startAfterDoc = await adminDb
        .collection('users')
        .doc(userId)
        .collection('likes')
        .doc(startAfterParam)
        .get();
      
      if (startAfterDoc.exists) {
        likesQuery = likesQuery.startAfter(startAfterDoc);
      }
    }

    const likesSnapshot = await likesQuery.get();
    const posts: Post[] = [];

    // Fetch post details for each liked post
    for (const likeDoc of likesSnapshot.docs) {
      const likeData = likeDoc.data();
      const postId = likeData.postId;

      try {
        const postDoc = await adminDb.collection('posts').doc(postId).get();
        
        if (postDoc.exists) {
          const postData = postDoc.data();
          
          // Get user data for the post owner
          const postUserDoc = await adminDb.collection('users').doc(postData.userId).get();
          const postUserData = postUserDoc.data();

          posts.push({
            id: postDoc.id,
            ...postData,
            userId: postData.userId,
            userName: postUserData?.displayName || 'Anonim Kullanıcı',
            userPhotoURL: postUserData?.photoURL || null,
            createdAt: postData.createdAt?.toDate() || new Date()
          } as Post);
        }
      } catch (error) {
        console.error(`Error fetching post ${postId}:`, error);
      }
    }

    const hasMore = likesSnapshot.size === limit;
    const lastLikeId = likesSnapshot.docs[likesSnapshot.docs.length - 1]?.id;

    return NextResponse.json({
      posts,
      hasMore,
      lastLikeId
    });

  } catch (error) {
    console.error('Error fetching liked posts:', error);
    return NextResponse.json({ error: 'Beğenilen postlar yüklenirken hata oluştu' }, { status: 500 });
  }
}
