import { NextResponse } from 'next/server';
import { db as adminDb } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { requestId, fromUserId, toUserId } = await request.json();

    if (!requestId || !fromUserId || !toUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authResult = await verifyAuth(request);

    if (!authResult.authenticated || authResult.userId !== toUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batch = adminDb.batch();

    // Update sender's friends list
    const fromUserRef = adminDb.collection('users').doc(fromUserId);
    batch.update(fromUserRef, { friends: FieldValue.arrayUnion(toUserId) });

    // Update receiver's friends list
    const toUserRef = adminDb.collection('users').doc(toUserId);
    batch.update(toUserRef, { friends: FieldValue.arrayUnion(fromUserId) });

    // Update the friend request status
    const requestRef = adminDb.collection('friendRequests').doc(requestId);
    batch.update(requestRef, { 
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

