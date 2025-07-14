import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdmin } from '@/app/lib/firebase-admin';

export async function GET(req: NextRequest) {
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
    
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let query = adminDb.collection('reports');
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    // Filter by type if provided (post or user reports)
    if (type && type !== 'all') {
      if (type === 'post') {
        query = query.where('postId', '!=', null);
      } else if (type === 'user') {
        query = query.where('reportedUserId', '!=', null);
      }
    }
    
    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc');
    
    // Apply pagination
    if (offset > 0) {
      // For pagination, we'd need to implement cursor-based pagination
      // For now, we'll use a simple offset approach
      query = query.offset(offset);
    }
    query = query.limit(limit);
    
    const snapshot = await query.get();
    const reports = [];
    
    // Process each report
    for (const doc of snapshot.docs) {
      const reportData = doc.data();
      const report = {
        id: doc.id,
        ...reportData,
        createdAt: reportData.createdAt?.toDate?.() || reportData.createdAt,
        updatedAt: reportData.updatedAt?.toDate?.() || reportData.updatedAt,
      };
      
      // If it's a post report, get post details
      if (reportData.postId) {
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
      
      // If it's a user report, get user details
      if (reportData.reportedUserId) {
        try {
          const userDoc = await adminDb.collection('users').doc(reportData.reportedUserId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            report.reportedUserName = userData?.name || 'Bilinmeyen Kullanıcı';
            report.reportedUserEmail = userData?.email || '';
          } else {
            report.reportedUserName = 'Silinmiş Kullanıcı';
          }
        } catch (error) {
          console.error('Error fetching reported user details:', error);
          report.reportedUserName = 'Hata: Kullanıcı bilgileri alınamadı';
        }
      }
      
      // Get reporter info
      if (reportData.reportedBy) {
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
      
      reports.push(report);
    }
    
    // Get total count for pagination
    const totalQuery = adminDb.collection('reports');
    const totalSnapshot = await totalQuery.get();
    const totalCount = totalSnapshot.size;
    
    return NextResponse.json({
      reports,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
