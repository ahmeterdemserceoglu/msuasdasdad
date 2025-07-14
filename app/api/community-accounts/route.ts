import { NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('communityAccounts').get();
    const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching public community accounts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
