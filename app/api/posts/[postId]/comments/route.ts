import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Comment } from '@/app/types';

// GET: Yorumları listele (pagination ile)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Await params before accessing postId
    const { postId } = await params;
    
    // Get query parameters for pagination
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit') || '10';
    const startAfterParam = searchParams.get('startAfter');
    const limit = parseInt(limitParam);

    // Check if post exists
    const postDoc = await adminDb.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı' }, { status: 404 });
    }

    // Build comments query
    let commentsQuery = adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // If startAfter is provided, start after that document
    if (startAfterParam) {
      const startAfterDoc = await adminDb
        .collection('posts')
        .doc(postId)
        .collection('comments')
        .doc(startAfterParam)
        .get();
      
      if (startAfterDoc.exists) {
        commentsQuery = commentsQuery.startAfter(startAfterDoc);
      }
    }

    const commentsSnapshot = await commentsQuery.get();
    const comments: Comment[] = [];

    // Fetch comments with user data
    for (const commentDoc of commentsSnapshot.docs) {
      const commentData = commentDoc.data();
      
      try {
        // Get user data for each comment
        const userDoc = await adminDb.collection('users').doc(commentData.userId).get();
        const userData = userDoc.data();
        
        comments.push({
          id: commentDoc.id,
          postId: postId,
          userId: commentData.userId,
          userName: userData?.displayName || 'Anonim Kullanıcı',
          userPhotoURL: userData?.photoURL || null,
          content: commentData.content,
          likeCount: commentData.likeCount || 0,
          parentId: commentData.parentId || undefined,
          replyCount: commentData.replyCount || 0,
          createdAt: commentData.createdAt?.toDate() || new Date()
        });
      } catch (error) {
        console.error('Error fetching user data for comment:', error);
        // Add comment with default user data if user fetch fails
        comments.push({
          id: commentDoc.id,
          postId: postId,
          userId: commentData.userId,
          userName: 'Anonim Kullanıcı',
          userPhotoURL: null,
          content: commentData.content,
          likeCount: commentData.likeCount || 0,
          parentId: commentData.parentId || undefined,
          replyCount: commentData.replyCount || 0,
          createdAt: commentData.createdAt?.toDate() || new Date()
        });
      }
    }

    // Check if there are more comments
    const hasMore = commentsSnapshot.size === limit;
    const lastCommentId = commentsSnapshot.docs[commentsSnapshot.docs.length - 1]?.id;

    return NextResponse.json({
      comments,
      hasMore,
      lastCommentId,
      total: commentsSnapshot.size
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Yorumlar yüklenirken hata oluştu' }, { status: 500 });
  }
}

// POST: Yeni yorum ekle
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
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
    
    // Await params before accessing postId
    const { postId } = await params;
    
    // Get comment content from request body
    const { content } = await req.json();
    
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Yorum içeriği boş olamaz' }, { status: 400 });
    }

    // Check if post exists
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı' }, { status: 404 });
    }

    const postData = postDoc.data();

    // Get user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Create comment
    const commentData = {
      userId,
      content: content.trim(),
      likeCount: 0,
      replyCount: 0,
      createdAt: FieldValue.serverTimestamp()
    };

    const commentRef = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .add(commentData);

    // Update post comment count
    await postRef.update({
      commentCount: FieldValue.increment(1)
    });

    // Create notification for post owner (if not commenting on own post)
    if (postData?.userId && postData.userId !== userId) {
      await adminDb.collection('notifications').add({
        userId: postData.userId,
        type: 'post_commented',
        title: 'Gönderinize yorum yapıldı',
        message: `${userData?.displayName || 'Bir kullanıcı'} gönderinize yorum yaptı: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        postId: postId,
        fromUserId: userId,
        read: false,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // Return the created comment
    const newComment: Comment = {
      id: commentRef.id,
      postId: postId,
      userId,
      userName: userData?.displayName || 'Anonim Kullanıcı',
      userPhotoURL: userData?.photoURL || null,
      content: content.trim(),
      likeCount: 0,
      replyCount: 0,
      createdAt: new Date()
    };

    return NextResponse.json({ 
      success: true,
      comment: newComment
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Yorum eklenirken hata oluştu' }, { status: 500 });
  }
}

// DELETE: Yorum sil (sadece yorum sahibi veya admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
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
    
    // Await params before accessing postId
    const { postId } = await params;
    
    // Get comment ID from request body
    const { commentId } = await req.json();
    
    if (!commentId) {
      return NextResponse.json({ error: 'Yorum ID\'si gerekli' }, { status: 400 });
    }

    // Check if post exists
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı' }, { status: 404 });
    }

    // Get comment
    const commentRef = adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId);
    
    const commentDoc = await commentRef.get();
    
    if (!commentDoc.exists) {
      return NextResponse.json({ error: 'Yorum bulunamadı' }, { status: 404 });
    }

    const commentData = commentDoc.data();

    // Check if user is admin
    let isAdmin = false;
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      isAdmin = userData?.isAdmin === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
    }

    // Check if user is the comment owner or admin
    if (commentData?.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Bu yorumu silme yetkiniz yok' }, { status: 403 });
    }

    // Delete comment
    await commentRef.delete();

    // Update post comment count
    await postRef.update({
      commentCount: FieldValue.increment(-1)
    });

    return NextResponse.json({ 
      success: true,
      message: 'Yorum başarıyla silindi'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Yorum silinirken hata oluştu' }, { status: 500 });
  }
}
