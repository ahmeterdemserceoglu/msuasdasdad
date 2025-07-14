import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdmin } from '@/app/lib/firebase-admin';

interface Report {
  status: 'pending' | 'resolved' | 'dismissed';
  updatedAt: Date;
  adminNote?: string;
  resolvedAt?: Date;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from headers
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Yetkilendirme token\'ı gerekli.' }, { status: 401 });
    }
    
    // Verify admin access
    const isAdmin = await verifyAdmin(token);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Bu işlem için admin yetkisi gerekli.' }, { status: 403 });
    }
    
    const { id } = await params;
    const body = await req.json();
    const { status, adminNote } = body;
    
    // Validate status
    const validStatuses = ['pending', 'resolved', 'dismissed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Geçersiz durum. Geçerli durumlar: pending, resolved, dismissed' 
      }, { status: 400 });
    }
    
    // Check if report exists
    const reportRef = adminDb.collection('reports').doc(id);
    const reportDoc = await reportRef.get();
    
    if (!reportDoc.exists) {
      return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 });
    }
    
    // Update report status
    const updateData: Partial<Report> = {
      status,
      updatedAt: new Date(),
    };
    
    // Add admin note if provided
    if (adminNote) {
      updateData.adminNote = adminNote;
    }
    
    // If resolving the report, add resolution timestamp
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
    
    await reportRef.update(updateData);
    
    // Get updated report data
    const updatedDoc = await reportRef.get();
    const updatedReport = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate?.() || updatedDoc.data()?.createdAt,
      updatedAt: updatedDoc.data()?.updatedAt?.toDate?.() || updatedDoc.data()?.updatedAt,
      resolvedAt: updatedDoc.data()?.resolvedAt?.toDate?.() || updatedDoc.data()?.resolvedAt,
    };
    
    return NextResponse.json({
      message: 'Rapor durumu başarıyla güncellendi.',
      report: updatedReport
    });
    
  } catch (error) {
    console.error('Error updating report status:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from headers
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Yetkilendirme token\'ı gerekli.' }, { status: 401 });
    }
    
    // Verify admin access
    const isAdmin = await verifyAdmin(token);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Bu işlem için admin yetkisi gerekli.' }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Check if report exists
    const reportRef = adminDb.collection('reports').doc(id);
    const reportDoc = await reportRef.get();
    
    if (!reportDoc.exists) {
      return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 });
    }
    
    // Delete the report
    await reportRef.delete();
    
    return NextResponse.json({
      message: 'Rapor başarıyla silindi.'
    });
    
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from headers
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Yetkilendirme token\'ı gerekli.' }, { status: 401 });
    }
    
    // Verify admin access
    const isAdmin = await verifyAdmin(token);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Bu işlem için admin yetkisi gerekli.' }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Get report data
    const reportDoc = await adminDb.collection('reports').doc(id).get();
    
    if (!reportDoc.exists) {
      return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 });
    }
    
    const reportData = reportDoc.data();
    const report = {
      id: reportDoc.id,
      ...reportData,
      createdAt: reportData?.createdAt?.toDate?.() || reportData?.createdAt,
      updatedAt: reportData?.updatedAt?.toDate?.() || reportData?.updatedAt,
      resolvedAt: reportData?.resolvedAt?.toDate?.() || reportData?.resolvedAt,
    };
    
    // If it's a post report, get post details
    if (reportData?.postId) {
      try {
        const postDoc = await adminDb.collection('posts').doc(reportData.postId).get();
        if (postDoc.exists) {
          const postData = postDoc.data();
          report.postTitle = postData?.title || 'Başlık bulunamadı';
          report.postContent = postData?.content || '';
          report.postAuthorId = postData?.userId || '';
          
          // Get post author info
          if (postData?.userId) {
            try {
              const authorDoc = await adminDb.collection('users').doc(postData.userId).get();
              if (authorDoc.exists) {
                const authorData = authorDoc.data();
                report.postAuthorName = authorData?.name || 'Bilinmeyen Kullanıcı';
                report.postAuthorEmail = authorData?.email || '';
              }
            } catch (error) {
              console.error('Error fetching post author:', error);
              report.postAuthorName = 'Bilinmeyen Kullanıcı';
            }
          }
        } else {
          report.postTitle = 'Silinmiş Post';
          report.postContent = '';
        }
      } catch (error) {
        console.error('Error fetching post details:', error);
        report.postTitle = 'Hata: Post bilgileri alınamadı';
      }
    }
    
    // Get reporter info
    if (reportData?.reportedBy) {
      try {
        const reporterDoc = await adminDb.collection('users').doc(reportData.reportedBy).get();
        if (reporterDoc.exists) {
          const reporterData = reporterDoc.data();
          report.reporterName = reporterData?.name || 'Bilinmeyen Kullanıcı';
          report.reporterEmail = reporterData?.email || '';
        } else {
          report.reporterName = 'Bilinmeyen Kullanıcı';
        }
      } catch (error) {
        console.error('Error fetching reporter info:', error);
        report.reporterName = 'Bilinmeyen Kullanıcı';
      }
    }
    
    return NextResponse.json({ report });
    
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
