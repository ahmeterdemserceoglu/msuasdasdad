import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
export const db = adminDb; // Alias for compatibility

// Verify if user is admin
export async function verifyAdmin(idToken: string): Promise<boolean> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if user has admin custom claim
    if (decodedToken.admin === true) {
      return true;
    }
    
    // Alternatively, check if user is in admin list (you can modify this based on your needs)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    
    
    // Debug logging removed for security
    
    if (decodedToken.email && adminEmails.includes(decodedToken.email)) {
      return true;
    }
    
    // Check Firestore user document for isAdmin field
    try {
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        // Debug logging removed for security
        if (userData?.isAdmin === true) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking user document:', error);
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return false;
  }
}

// Helper function to set admin custom claim
export async function setAdminClaim(uid: string, isAdmin: boolean = true): Promise<void> {
  try {
    await adminAuth.setCustomUserClaims(uid, { admin: isAdmin });
    // Admin claim updated successfully
  } catch (error) {
    console.error('Error setting admin claim:', error);
    throw error;
  }
}
