import { adminAuth, db } from './firebase-admin';
import { User } from '../types';

/**
 * Set or remove admin privileges for a user
 * @param email - User's email address
 * @param isAdmin - Whether to grant or revoke admin privileges
 */
export async function setAdminByEmail(email: string, isAdmin: boolean = true): Promise<void> {
  try {
    // Get user by email
    const user = await adminAuth.getUserByEmail(email);

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(user.uid, { admin: isAdmin });

    // Admin claim updated successfully
  } catch (error) {
    console.error('Error setting admin claim:', error);
    throw error;
  }
}

/**
 * Check if a user is an admin
 * @param uid - User's UID
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const user = await adminAuth.getUser(uid);
    return user.customClaims?.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get all users with admin privileges
 */
export async function getAllAdmins(): Promise<Array<{ uid: string, email: string | undefined }>> {
  const admins: Array<{ uid: string, email: string | undefined }> = [];

  try {
    // List all users (paginated)
    let pageToken: string | undefined;

    do {
      const listUsersResult = await adminAuth.listUsers(1000, pageToken);

      listUsersResult.users.forEach((userRecord) => {
        if (userRecord.customClaims?.admin === true) {
          admins.push({
            uid: userRecord.uid,
            email: userRecord.email
          });
        }
      });

      pageToken = listUsersResult.pageToken;
    } while (pageToken);

    return admins;
  } catch (error) {
    console.error('Error listing admins:', error);
    throw error;
  }
}

/**
 * Check if a user has admin privileges and return admin status
 * @param userId - User's UID
 */
export async function checkAdminAuth(userId: string): Promise<{ isAdmin: boolean, user?: User }> {
  try {
    // First check if user exists in Firestore
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { isAdmin: false };
    }

    const userData = userDoc.data() as User;

    // Check if user is admin in Firestore
    if (userData?.isAdmin === true) {
      return { isAdmin: true, user: userData };
    }

    // Also check Firebase Auth custom claims as fallback
    try {
      const userRecord = await adminAuth.getUser(userId);
      if (userRecord.customClaims?.admin === true) {
        return { isAdmin: true, user: userData };
      }
    } catch (authError) {
      console.warn('Could not check auth custom claims:', authError);
    }

    return { isAdmin: false, user: userData };
  } catch (error) {
    console.error('Error checking admin auth:', error);
    return { isAdmin: false };
  }
}
