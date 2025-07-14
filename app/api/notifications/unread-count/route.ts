import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get unread notification count
    const unreadCount = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get()
      .then(snapshot => snapshot.size);

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
