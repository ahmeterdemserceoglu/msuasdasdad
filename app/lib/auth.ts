import { NextRequest } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';

interface AuthResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'No authorization header' };
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return { authenticated: false, error: 'No token provided' };
    }
    
    try {
      // Verify the ID token using Firebase Admin SDK
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      return {
        authenticated: true,
        userId: decodedToken.uid
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return { authenticated: false, error: 'Invalid or expired token' };
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authenticated: false, error: 'Authentication error' };
  }
}

export function generateAuthToken(userId: string): string {
  // In a real application, generate a proper JWT token
  // For now, return the userId as a placeholder
  return userId;
}
