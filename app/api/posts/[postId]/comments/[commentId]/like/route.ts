import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
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

    // Await params before accessing them
    const { postId, commentId } = await params;

    // Get the comment
    const commentRef = adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId);
    
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const commentData = commentDoc.data();

    // Check if user already liked this comment
    const userLikeRef = adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId)
      .collection('likes')
      .doc(userId);

    const userLikeDoc = await userLikeRef.get();

    if (userLikeDoc.exists) {
      // Unlike
      await userLikeRef.delete();
      await commentRef.update({
        likeCount: FieldValue.increment(-1)
      });

      // Get current like count
      const updatedCommentDoc = await commentRef.get();
      const updatedCommentData = updatedCommentDoc.data();

      return NextResponse.json({ 
        liked: false, 
        likes: updatedCommentData?.likeCount || 0 
      });
    } else {
      // Like
      await userLikeRef.set({
        userId,
        createdAt: FieldValue.serverTimestamp()
      });

      await commentRef.update({
        likeCount: FieldValue.increment(1)
      });

      // Create notification for comment owner (if not liking own comment)
      if (commentData?.userId && commentData.userId !== userId) {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        await adminDb.collection('notifications').add({
          userId: commentData.userId,
          type: 'comment_liked',
          title: 'Yorumunuz beğenildi',
          message: `${userData?.displayName || 'Bir kullanıcı'} yorumunuzu beğendi`,
          postId: postId,
          commentId: commentId,
          fromUserId: userId,
          read: false,
          createdAt: FieldValue.serverTimestamp()
        });
      }

      // Get current like count
      const updatedCommentDoc = await commentRef.get();
      const updatedCommentData = updatedCommentDoc.data();

      return NextResponse.json({ 
        liked: true, 
        likes: updatedCommentData?.likeCount || 1 
      });
    }
  } catch (error: any) {
    console.error('Error in comment like/unlike:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Check if user liked a comment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json({ liked: false });
    }

    const userId = authResult.userId!;
    
    // Await params before accessing them
    const { postId, commentId } = await params;

    const userLikeDoc = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId)
      .collection('likes')
      .doc(userId)
      .get();

    return NextResponse.json({ liked: userLikeDoc.exists });
  } catch (error) {
    return NextResponse.json({ liked: false });
  }
}
