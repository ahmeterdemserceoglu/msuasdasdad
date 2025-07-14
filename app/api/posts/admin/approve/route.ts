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

    // Get post ID from request body
    const body = await req.json();
    const { postId } = body;
    
    if (!postId) {
      return NextResponse.json({ error: 'Post ID gerekli.' }, { status: 400 });
    }

    // Check if post exists
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı.' }, { status: 404 });
    }

    const postData = postDoc.data();
    
    // Check if post is already approved
    if (postData?.isApproved === true) {
      return NextResponse.json({ error: 'Bu post zaten onaylanmış.' }, { status: 400 });
    }

    // Use the verified admin ID
    const adminId = userId;

    // Update post status
    await postRef.update({
      status: 'approved',
      isApproved: true,
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: adminId
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
            status: 'approved',
            isApproved: true,
            approvedAt: FieldValue.serverTimestamp()
          })
        );
        
        await Promise.all(updatePromises);
      } catch (error) {
        console.error('Error updating user posts subcollection:', error);
        // Don't fail the main operation if subcollection update fails
      }
    }

    // Optional: Send notification to post author
    // You can implement this based on your notification system

    return NextResponse.json({ 
      success: true,
      message: 'Post başarıyla onaylandı.',
      postId 
    });
    
  } catch (error) {
    console.error('Error approving post:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
