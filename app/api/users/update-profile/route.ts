import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { updateProfile } from 'firebase/auth';

export async function PUT(req: NextRequest) {
  try {
    // Get authorization token
    const authorization = req.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ error: 'Yetkilendirme başlığı eksik' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Geçersiz token formatı' }, { status: 401 });
    }

    // Verify token and get user
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // Get data from request body
    const { displayName, bio, city, birthYear, interviewDate, interviewTime, interviewCity, interviewBranch } = await req.json();

    // Validation
    if (!displayName || displayName.trim() === '') {
      return NextResponse.json({ error: 'İsim alanı zorunludur' }, { status: 400 });
    }

    if (bio && bio.length > 200) {
      return NextResponse.json({ error: 'Bio 200 karakterden uzun olamaz' }, { status: 400 });
    }

    if (birthYear !== null && birthYear !== undefined) {
      const year = parseInt(birthYear);
      if (isNaN(year) || year < 1950 || year > new Date().getFullYear() - 10) {
        return NextResponse.json({ error: 'Geçersiz doğum yılı' }, { status: 400 });
      }
    }

    // Update user document in Firestore
    const updateData: any = {
      displayName: displayName.trim(),
      bio: bio?.trim() || '',
      city: city?.trim() || '',
      updatedAt: new Date()
    };

    if (birthYear !== null && birthYear !== undefined) {
      updateData.birthYear = parseInt(birthYear);
    }

    // Add interview fields if provided
    if (interviewDate !== undefined) {
      updateData.interviewDate = interviewDate?.trim() || '';
    }
    if (interviewTime !== undefined) {
      updateData.interviewTime = interviewTime?.trim() || '';
    }
    if (interviewCity !== undefined) {
      updateData.interviewCity = interviewCity?.trim() || '';
    }
    if (interviewBranch !== undefined) {
      updateData.interviewBranch = interviewBranch?.trim() || '';
    }

    await adminDb.collection('users').doc(userId).update(updateData);

    // Also update the display name in Firebase Auth
    try {
      await adminAuth.updateUser(userId, {
        displayName: displayName.trim()
      });
    } catch (error) {
      console.error('Error updating Firebase Auth display name:', error);
      // Continue even if Auth update fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profil başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Profil güncellenirken hata oluştu' }, { status: 500 });
  }
}
