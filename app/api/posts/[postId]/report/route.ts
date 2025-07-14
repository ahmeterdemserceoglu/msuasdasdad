import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı gerekli.' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the user's token
    let userId: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (e) {
      return NextResponse.json(
        { error: 'Geçersiz token.' },
        { status: 401 }
      );
    }

    const { postId } = await params;
    const body = await request.json();
    const { reason = 'inappropriate', description = '' } = body;

    // Check if the post exists
    const postDoc = await adminDb.collection('posts').doc(postId).get();
    if (!postDoc.exists) {
      return NextResponse.json(
        { error: 'Gönderi bulunamadı.' },
        { status: 404 }
      );
    }

    // Check if user has already reported this post
    const existingReport = await adminDb.collection('reports')
      .where('postId', '==', postId)
      .where('reportedBy', '==', userId)
      .where('status', '==', 'pending')
      .get();

    if (!existingReport.empty) {
      return NextResponse.json(
        { error: 'Bu gönderiyi zaten raporladınız.' },
        { status: 400 }
      );
    }

    // Create the report
    const reportData = {
      postId,
      reportedBy: userId,
      reason,
      description,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      type: 'post'
    };

    const reportRef = await adminDb.collection('reports').add(reportData);

    // Optionally, you could also update a report count on the post
    // await adminDb.collection('posts').doc(postId).update({
    //   reportCount: FieldValue.increment(1)
    // });

    return NextResponse.json({
      success: true,
      message: 'Gönderi başarıyla raporlandı.',
      reportId: reportRef.id
    });

  } catch (e: Error) {
    console.error('Error reporting post:', e);
    return NextResponse.json(
      { error: 'Raporlama işlemi sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
