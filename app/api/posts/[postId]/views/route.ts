import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    // Get user IP for basic duplicate prevention
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Check if post exists
    const postDoc = await adminDb.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı' }, { status: 404 });
    }

    // Create a unique view identifier
    const viewId = `${postId}_${ip}_${new Date().toISOString().split('T')[0]}`;
    
    // Check if this view already exists today
    const viewDoc = await adminDb.collection('postViews').doc(viewId).get();
    
    if (viewDoc.exists) {
      // Already viewed today, return current count
      const postData = postDoc.data();
      return NextResponse.json({ 
        views: postData?.viewCount || 0,
        alreadyViewed: true 
      });
    }
    
    // Record the view
    await adminDb.collection('postViews').doc(viewId).set({
      postId,
      ip,
      timestamp: FieldValue.serverTimestamp()
    });
    
    // Increment view count
    await adminDb.collection('posts').doc(postId).update({
      viewCount: FieldValue.increment(1)
    });
    
    // Get updated count
    const updatedPost = await adminDb.collection('posts').doc(postId).get();
    const updatedData = updatedPost.data();
    
    return NextResponse.json({ 
      views: updatedData?.viewCount || 1,
      alreadyViewed: false 
    });
    
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ error: 'View tracking failed' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    // Get post view count
    const postDoc = await adminDb.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post bulunamadı' }, { status: 404 });
    }
    
    const postData = postDoc.data();
    
    return NextResponse.json({ 
      views: postData?.viewCount || 0 
    });
    
  } catch (error) {
    console.error('Error getting view count:', error);
    return NextResponse.json({ error: 'Failed to get view count' }, { status: 500 });
  }
}
