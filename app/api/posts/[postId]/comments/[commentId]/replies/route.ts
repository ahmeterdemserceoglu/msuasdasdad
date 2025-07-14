import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Comment } from '@/app/types';

// POST: Create a reply to a comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    // Get authorization token
    const authorization = req.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ error: 'Yetkilendirme başlığı eksik' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Geçersiz token formatı' }, { status: 401 });
    }

    // Verify token and get user
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    
    // Await params before accessing them
    const { postId, commentId } = await params;
    
    // Get reply content from request body
    const { content } = await req.json();
    
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Yanıt içeriği boş olamaz' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Yanıt 500 karakterden uzun olamaz' }, { status: 400 });
    }

    // Check if post exists
    const postDoc = await adminDb.collection('posts').doc(postId).get();
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı' }, { status: 404 });
    }

    // Check if parent comment exists
    const parentCommentRef = adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId);
    
    const parentCommentDoc = await parentCommentRef.get();
    if (!parentCommentDoc.exists) {
      return NextResponse.json({ error: 'Ana yorum bulunamadı' }, { status: 404 });
    }

    const parentCommentData = parentCommentDoc.data();

    // Get user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Create reply
    const replyData = {
      userId,
      content: content.trim(),
      parentId: commentId,
      likeCount: 0,
      createdAt: FieldValue.serverTimestamp()
    };

    // Add reply as a comment with parentId
    const replyRef = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .add(replyData);

    // Update parent comment reply count
    await parentCommentRef.update({
      replyCount: FieldValue.increment(1)
    });

    // Update post comment count (replies count as comments too)
    await adminDb.collection('posts').doc(postId).update({
      commentCount: FieldValue.increment(1)
    });

    // Create notification for parent comment owner (if not replying to own comment)
    if (parentCommentData?.userId && parentCommentData.userId !== userId) {
      await adminDb.collection('notifications').add({
        userId: parentCommentData.userId,
        type: 'comment_replied',
        title: 'Yorumunuza yanıt verildi',
        message: `${userData?.displayName || 'Bir kullanıcı'} yorumunuza yanıt verdi: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        postId: postId,
        commentId: commentId,
        fromUserId: userId,
        read: false,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // Return the created reply
    const newReply: Comment = {
      id: replyRef.id,
      postId: postId,
      userId,
      userName: userData?.displayName || 'Anonim Kullanıcı',
      userPhotoURL: userData?.photoURL || null,
      content: content.trim(),
      parentId: commentId,
      likeCount: 0,
      replyCount: 0,
      createdAt: new Date()
    };

    return NextResponse.json({ 
      success: true,
      reply: newReply
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json({ error: 'Yanıt eklenirken hata oluştu' }, { status: 500 });
  }
}

// GET: Get replies for a comment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    // Await params before accessing them
    const { postId, commentId } = await params;
    
    // Get query parameters for pagination
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit') || '5';
    const limit = parseInt(limitParam);

    // Check if post and parent comment exist
    const postDoc = await adminDb.collection('posts').doc(postId).get();
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı' }, { status: 404 });
    }

    const parentCommentDoc = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId)
      .get();
    
    if (!parentCommentDoc.exists) {
      return NextResponse.json({ error: 'Ana yorum bulunamadı' }, { status: 404 });
    }

    // Get replies (comments with parentId)
    const repliesQuery = adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .where('parentId', '==', commentId)
      .orderBy('createdAt', 'asc')
      .limit(limit);

    const repliesSnapshot = await repliesQuery.get();
    const replies: Comment[] = [];

    // Fetch replies with user data
    for (const replyDoc of repliesSnapshot.docs) {
      const replyData = replyDoc.data();
      
      try {
        // Get user data for each reply
        const userDoc = await adminDb.collection('users').doc(replyData.userId).get();
        const userData = userDoc.data();
        
        replies.push({
          id: replyDoc.id,
          postId: postId,
          userId: replyData.userId,
          userName: userData?.displayName || 'Anonim Kullanıcı',
          userPhotoURL: userData?.photoURL || null,
          content: replyData.content,
          parentId: replyData.parentId,
          likeCount: replyData.likeCount || 0,
          replyCount: 0, // Replies don't have sub-replies for now
          createdAt: replyData.createdAt?.toDate() || new Date()
        });
      } catch (error) {
        console.error('Error fetching user data for reply:', error);
        // Add reply with default user data if user fetch fails
        replies.push({
          id: replyDoc.id,
          postId: postId,
          userId: replyData.userId,
          userName: 'Anonim Kullanıcı',
          userPhotoURL: null,
          content: replyData.content,
          parentId: replyData.parentId,
          likeCount: replyData.likeCount || 0,
          replyCount: 0,
          createdAt: replyData.createdAt?.toDate() || new Date()
        });
      }
    }

    return NextResponse.json({
      replies,
      total: replies.length
    });

  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json({ error: 'Yanıtlar yüklenirken hata oluştu' }, { status: 500 });
  }
}
