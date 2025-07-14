import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Await params before accessing notificationId
    const { notificationId } = await params;

    // Get the notification to verify ownership
    const notificationDoc = await adminDb
      .collection('notifications')
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const notificationData = notificationDoc.data();
    
    // Verify the notification belongs to the user
    if (notificationData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Mark as read
    await adminDb
      .collection('notifications')
      .doc(notificationId)
      .update({ read: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
