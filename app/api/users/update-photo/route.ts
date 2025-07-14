import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/app/lib/firebase-admin';

export async function POST(req: NextRequest) {
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

    // Get form data
    const formData = await req.formData();
    const photoFile = formData.get('photo') as File;

    if (!photoFile) {
      return NextResponse.json({ error: 'Fotoğraf dosyası bulunamadı' }, { status: 400 });
    }

    // Validate file type
    if (!photoFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Geçersiz dosya formatı' }, { status: 400 });
    }

    // Validate file size (5MB)
    if (photoFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dosya boyutu 5MB\'dan büyük olamaz' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await photoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const fileName = `users/${userId}/profile-${Date.now()}.${photoFile.type.split('/')[1]}`;
    const file = bucket.file(fileName);

    // Upload the file
    await file.save(buffer, {
      metadata: {
        contentType: photoFile.type,
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const photoURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update user document in Firestore
    await adminDb.collection('users').doc(userId).update({
      photoURL,
      updatedAt: new Date()
    });

    // Also update the photo URL in Firebase Auth
    try {
      await adminAuth.updateUser(userId, {
        photoURL
      });
    } catch (error) {
      console.error('Error updating Firebase Auth photo URL:', error);
      // Continue even if Auth update fails
    }

    // Delete old photo if exists
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (userData?.photoURL && userData.photoURL.includes('storage.googleapis.com')) {
        const oldFileName = userData.photoURL.split('/').pop();
        if (oldFileName && oldFileName !== fileName.split('/').pop()) {
          const oldFile = bucket.file(`users/${userId}/${oldFileName}`);
          await oldFile.delete().catch(() => {
            // Ignore errors when deleting old file
          });
        }
      }
    } catch (error) {
      console.error('Error deleting old photo:', error);
      // Continue even if old photo deletion fails
    }

    return NextResponse.json({ 
      success: true,
      photoURL,
      message: 'Profil fotoğrafı başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Photo update error:', error);
    return NextResponse.json({ error: 'Fotoğraf güncellenirken hata oluştu' }, { status: 500 });
  }
}
