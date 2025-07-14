import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// Check if user is admin
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

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    const userId = authResult.userId!;

    // Verify admin access
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Bu işlem için admin yetkisi gerekli.' }, { status: 403 });
    }

    // Get post ID and rejection reason from request body
    const { postId, reason } = await req.json();
    
    if (!postId) {
      return NextResponse.json({ error: 'Post ID gerekli.' }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reddetme sebebi belirtilmeli.' }, { status: 400 });
    }

    // Check if post exists
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı.' }, { status: 404 });
    }

    const postData = postDoc.data();
    
    // Check if post is already processed
    if (postData?.status !== 'pending') {
      return NextResponse.json({ error: 'Bu post zaten işlenmiş.' }, { status: 400 });
    }

    // Use the verified admin ID
    const adminId = userId;

    // Update post status
    await postRef.update({
      status: 'rejected',
      isApproved: false,
      rejectedAt: FieldValue.serverTimestamp(),
      rejectedBy: adminId,
      rejectionReason: reason
    });

    // Update user's posts subcollection
    if (postData?.userId) {
      try {
        // Find the post in user's subcollection
        const userPostsQuery = await adminDb
          .collection('users')
          .doc(postData.userId)
          .collection('posts')
          .where('postId', '==', postId)
          .get();
        
        // Update each matching document
        const updatePromises = userPostsQuery.docs.map(doc => 
          doc.ref.update({
            status: 'rejected',
            isApproved: false,
            rejectedAt: FieldValue.serverTimestamp(),
            rejectionReason: reason
          })
        );
        
        await Promise.all(updatePromises);
      } catch (error) {
        console.error('Error updating user posts subcollection:', error);
        // Don't fail the main operation if subcollection update fails
      }
    }

    // Create a notification for the user about the rejection
    await adminDb.collection('notifications').add({
      userId: postData.userId,
      type: 'post_rejected',
      title: 'Gönderiniz Reddedildi',
      message: `"${postData.title}" başlıklı gönderiniz reddedildi. Sebep: ${reason}`,
      postId: postId,
      createdAt: FieldValue.serverTimestamp(),
      read: false
    });

    return NextResponse.json({ 
      success: true,
      message: 'Post reddedildi ve kullanıcı bilgilendirildi.',
      postId 
    });
    
  } catch (error) {
    console.error('Error rejecting post:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
