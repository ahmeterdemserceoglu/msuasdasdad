import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get all unread notifications for the user
    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    // Batch update all notifications
    const batch = adminDb.batch();
    
    notificationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      updatedCount: notificationsSnapshot.size 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
