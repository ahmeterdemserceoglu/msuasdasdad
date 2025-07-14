import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';

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

export async function GET(req: NextRequest) {
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

    // Get all pending posts
    const postsRef = adminDb.collection('posts');
    const pendingQuery = postsRef
      .where('status', '==', 'pending')
      .where('isApproved', '==', false)
      .orderBy('createdAt', 'desc');
    
    const snapshot = await pendingQuery.get();
    
    const pendingPosts = [];
    for (const doc of snapshot.docs) {
      const postData = doc.data();
      
      // Get user info for each post
      const userDoc = await adminDb.collection('users').doc(postData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      
      pendingPosts.push({
        id: doc.id,
        ...postData,
        author: userData ? {
          id: postData.userId,
          name: userData.name || 'İsimsiz Kullanıcı',
          email: userData.email
        } : null
      });
    }

    return NextResponse.json({ 
      posts: pendingPosts,
      total: pendingPosts.length 
    });
    
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
