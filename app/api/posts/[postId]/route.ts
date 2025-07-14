import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Get the post
    const postDoc = await adminDb.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı' }, { status: 404 });
    }

    const postData = postDoc.data();

    // Get user data
    let userData = null;
    try {
      const userDoc = await adminDb.collection('users').doc(postData?.userId).get();
      userData = userDoc.data();
    } catch (err: unknown) {
      console.error('Error fetching user data:', err);
    }

    // Get comment count
    const commentsSnapshot = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .get();
    const commentCount = commentsSnapshot.size;

    // Get like count
    const likesSnapshot = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('likes')
      .get();
    const likeCount = likesSnapshot.size;

    // Self-healing: a Likes count is different from the real number of likes
    if (postData?.likes !== likeCount) {
        await adminDb.collection('posts').doc(postId).update({ likes: likeCount });
    }

    const post = {
      id: postDoc.id,
      ...postData,
      userName: userData?.displayName || 'Anonim Kullanıcı',
      userPhotoURL: userData?.photoURL || null,
      commentCount,
      likes: likeCount,
      createdAt: postData?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      experienceDate: postData?.experienceDate || new Date().toISOString()
    };

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: 'Post alınırken hata oluştu' }, { status: 500 });
  }
}

// Check if user can view this post (for private posts, etc.)
// Update post
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const authorization = req.headers.get('authorization');

    if (!authorization) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    // Verify token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Check if post exists
    const postDoc = await adminDb.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı' }, { status: 404 });
    }

    const postData = postDoc.data();

    // Check if user is the owner or admin
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isAdmin = userData?.isAdmin === true;
    const isOwner = postData?.userId === userId;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Bu postu düzenleme yetkiniz yok' }, { status: 403 });
    }

    // Get update data from request body
    const body = await req.json();
    const {
      title,
      content,
      summary,
      interviewType,
      candidateType,
      city,
      tags,
      experienceDate
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Başlık ve içerik zorunludur' }, { status: 400 });
    }

    // Prepare update data
    const updateData: Record<string, string | string[] | FieldValue> = {
      title: title.trim(),
      content: content.trim(),
      summary: summary?.trim() || '',
      interviewType: interviewType || 'genel',
      candidateType: candidateType || 'subay',
      city: city?.trim() || '',
      tags: tags || [],
      experienceDate: experienceDate || new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp()
    };

    // Update the post
    await adminDb.collection('posts').doc(postId).update(updateData);

    // Get updated post data
    const updatedPostDoc = await adminDb.collection('posts').doc(postId).get();
    const updatedPostData = updatedPostDoc.data();

    // Get user data for the response
    let postUserData = null;
    try {
      const userDoc = await adminDb.collection('users').doc(updatedPostData?.userId).get();
      postUserData = userDoc.data();
    } catch (err: unknown) {
      console.error('Error fetching user data:', err);
    }

    // Get comment count
    const commentsSnapshot = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .get();
    const commentCount = commentsSnapshot.size;

    // Get like count
    const likesSnapshot = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('likes')
      .get();
    const likeCount = likesSnapshot.size;

    const updatedPost = {
      id: updatedPostDoc.id,
      ...updatedPostData,
      userName: postUserData?.displayName || 'Anonim Kullanıcı',
      userPhotoURL: postUserData?.photoURL || null,
      commentCount,
      likes: likeCount,
      createdAt: updatedPostData?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      updatedAt: updatedPostData?.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
      experienceDate: updatedPostData?.experienceDate || new Date().toISOString()
    };

    // Return updated post data
    return NextResponse.json({
      success: true,
      message: 'Post başarıyla güncellendi',
      post: updatedPost
    });

  } catch (error: unknown) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Post güncellenirken hata oluştu' }, { status: 500 });
  }
}

// Delete post
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const authorization = req.headers.get('authorization');

    if (!authorization) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    // Verify token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Check if post exists
    const postDoc = await adminDb.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı' }, { status: 404 });
    }

    const postData = postDoc.data();

    // Check if user is the owner or admin
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isAdmin = userData?.isAdmin === true;
    const isOwner = postData?.userId === userId;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Bu postu silme yetkiniz yok' }, { status: 403 });
    }

    // Delete likes subcollection
    const likesSnapshot = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('likes')
      .get();

    const batch = adminDb.batch();
    likesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete comments subcollection
    const commentsSnapshot = await adminDb
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .get();

    const commentBatch = adminDb.batch();
    commentsSnapshot.docs.forEach(doc => {
      commentBatch.delete(doc.ref);
    });
    await commentBatch.commit();

    // Delete post document
    await adminDb.collection('posts').doc(postId).delete();

    return NextResponse.json({ success: true, message: 'Post başarıyla silindi' });

  } catch (err: unknown) {
    console.error('Error deleting post:', err);
    return NextResponse.json({ error: 'Post silinirken hata oluştu' }, { status: 500 });
  }
}

// Check if user can view this post (for private posts, etc.)
export async function OPTIONS(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const authorization = req.headers.get('authorization');

    if (!authorization) {
      return NextResponse.json({ canView: true }); // Public posts
    }

    const token = authorization.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ canView: true });
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userId = decodedToken.uid;

      // Check if post exists and user has access
      const postDoc = await adminDb.collection('posts').doc(postId).get();

      if (!postDoc.exists) {
        return NextResponse.json({ canView: false, error: 'Post bulunamadı' }, { status: 404 });
      }

      const postData = postDoc.data();

      // Check if post is approved or if user is the owner or admin
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const isAdmin = userData?.isAdmin === true;
      const isOwner = postData?.userId === userId;

      const canView = postData?.status === 'approved' || isOwner || isAdmin;

      return NextResponse.json({ canView, isOwner, isAdmin });
    } catch {
      return NextResponse.json({ canView: true }); // Default to public access
    }
  } catch (error: unknown) {
    console.error('Error checking post access:', error);
    return NextResponse.json({ canView: false }, { status: 500 });
  }
}
