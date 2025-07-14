import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
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

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const authResult = await verifyAuth(request);
        
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
        const { postId } = await request.json();
        
        // Use the verified admin ID
        const adminId = userId;
        
        // Gönderinin var olup olmadığını kontrol et
        const postRef = adminDb.collection('posts').doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return NextResponse.json(
                { error: 'Gönderi bulunamadı.' },
                { status: 404 }
            );
        }

        // Gönderiyi sil
        await postRef.delete();

        // Silme işlemini logla
        await adminDb.collection('admin_logs').add({
            action: 'DELETE_POST',
            postId,
            adminId: adminId,
            timestamp: new Date().toISOString(),
            details: {
                deletedPost: postDoc.data()
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Gönderi başarıyla silindi.' 
        });

    } catch (error) {
        console.error('Gönderi silme hatası:', error);
        return NextResponse.json(
            { error: 'Gönderi silinirken bir hata oluştu.' },
            { status: 500 }
        );
    }
}
