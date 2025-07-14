import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.userId!;

    // Await params before accessing postId
    const { postId } = await params;

    // Get the post
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

const postData = postDoc.data();

    if (!postData) {
      return NextResponse.json({ error: 'Post data is missing' }, { status: 404 });
    }

    // Ensure likes count is a number
    if (typeof postData.likes !== 'number') {
        postData.likes = 0;
    }

    // Check if user already liked
    const userLikeRef = adminDb
      .collection('posts')
      .doc(postId)
      .collection('likes')
      .doc(userId);

    const userLikeDoc = await userLikeRef.get();

    if (userLikeDoc.exists) {
      // Unlike
      await userLikeRef.delete();
      await postRef.update({
        likes: FieldValue.increment(-1)
      });

      // Remove from user's liked posts
      await adminDb.collection('users').doc(userId).update({
        likedPosts: FieldValue.arrayRemove(postId)
      });

      // Get updated post data
      const updatedPostDoc = await postRef.get();
      const updatedPostData = updatedPostDoc.data();

      return NextResponse.json({ 
        liked: false, 
        likes: updatedPostData?.likes || 0 
      });
    } else {
      // Like
      await userLikeRef.set({
        userId,
        createdAt: FieldValue.serverTimestamp()
      });

      await postRef.update({
        likes: FieldValue.increment(1)
      });

      // Add to user's liked posts
      await adminDb.collection('users').doc(userId).update({
        likedPosts: FieldValue.arrayUnion(postId)
      });

      // Create notification for post owner
      if (postData?.userId && postData.userId !== userId) {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        await adminDb.collection('notifications').add({
          userId: postData.userId,
          type: 'like',
          title: 'Gönderiniz beğenildi',
          message: `${userData?.displayName || 'Bir kullanıcı'} gönderinizi beğendi`,
          postId: postId,
          fromUserId: userId,
          read: false,
          createdAt: FieldValue.serverTimestamp()
        });
      }

      // Get updated post data
      const updatedPostDoc = await postRef.get();
      const updatedPostData = updatedPostDoc.data();

      return NextResponse.json({ 
        liked: true, 
        likes: updatedPostData?.likes || 0 
      });
    }
  } catch (error) {
    console.error('Error in like/unlike:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Check if user liked a post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Authorization is optional for GET
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated) {
      // No auth or invalid auth - user is not logged in
      return NextResponse.json({ liked: false });
    }

    const userId = authResult.userId!;
    
    // Await params before accessing postId
    const { postId } = await params;

    const userLikeDoc = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('likes')
      .doc(userId)
      .get();

    return NextResponse.json({ liked: userLikeDoc.exists });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json({ liked: false });
  }
}
