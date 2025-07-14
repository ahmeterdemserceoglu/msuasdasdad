import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const userData = userDoc.data();
    
    // Return public user data only
    const publicUserData = {
      uid: userId,
      displayName: userData?.displayName || 'Anonim Kullanıcı',
      photoURL: userData?.photoURL || null,
      email: userData?.email || '',
      birthYear: userData?.birthYear || 2000,
      city: userData?.city || '',
      bio: userData?.bio || '',
      createdAt: userData?.createdAt?.toDate()?.toISOString() || new Date().toISOString()
    };

    return NextResponse.json({ user: publicUserData });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Kullanıcı bilgileri alınırken hata oluştu' }, { status: 500 });
  }
}
