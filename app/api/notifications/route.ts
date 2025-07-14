import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';

// GET: List user notifications with unread count
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check if only unread count is requested
    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get('countOnly') === 'true';

    if (countOnly) {
      // Get unread notification count
      const unreadCount = await adminDb
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get()
        .then(snapshot => snapshot.size);

      return NextResponse.json({ unreadCount });
    }

    // Get user's notifications
    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
    }));

    // Get unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Mark notification as read
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      const batch = adminDb.batch();
      const unreadNotifications = await adminDb
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      unreadNotifications.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
      return NextResponse.json({ success: true, markedCount: unreadNotifications.size });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

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

// DELETE: Delete notification
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

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

    // Delete the notification
    await adminDb
      .collection('notifications')
      .doc(notificationId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
