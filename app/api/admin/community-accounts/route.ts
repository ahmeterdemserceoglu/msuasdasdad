import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    if (userDoc.exists && userDoc.data()?.isAdmin === true) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId!;
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb.collection('communityAccounts').get();
    const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching community accounts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId!;
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { type, name, url, imageUrl } = data;

    if (!type || !name || !url) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const docRef = await adminDb.collection('communityAccounts').add({
      type,
      name,
      url,
      imageUrl: imageUrl || null,
      createdAt: new Date(),
    });

    return NextResponse.json({ id: docRef.id, message: 'Account added successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error adding community account:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId!;
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id, type, name, url, imageUrl } = await req.json();

    if (!id || !type || !name || !url) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await adminDb.collection('communityAccounts').doc(id).update({
      type,
      name,
      url,
      imageUrl: imageUrl || null,
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'Account updated successfully' });
  } catch (error) {
    console.error('Error updating community account:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId!;
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'Missing account ID' }, { status: 400 });
    }

    await adminDb.collection('communityAccounts').doc(id).delete();

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting community account:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
