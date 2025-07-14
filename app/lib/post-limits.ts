import { adminDb } from '@/app/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const DAILY_POST_LIMIT = 2;
const ISTANBUL_TIMEZONE = 'Europe/Istanbul';

/**
 * Get the start and end of today in Istanbul timezone
 */
function getIstanbulTodayBounds(): { startOfDay: Date; endOfDay: Date } {
  const now = new Date();
  
  // Create a date in Istanbul timezone
  const istanbulDateStr = now.toLocaleDateString('en-CA', { 
    timeZone: ISTANBUL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parse the date string to create start of day
  const [year, month, day] = istanbulDateStr.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day));
  
  // Adjust for Istanbul timezone offset (UTC+3)
  startOfDay.setHours(startOfDay.getHours() - 3);
  
  // End of day is 24 hours later minus 1 millisecond
  const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);
  
  return { startOfDay, endOfDay };
}

/**
 * Check the daily post limit for a user
 * @param userId - The ID of the user to check
 * @returns Object containing remaining post count and whether user can post
 */
export async function checkDailyPostLimit(userId: string): Promise<{
  canPost: boolean;
  remainingPosts: number;
  postsToday: number;
}> {
  try {
    const { startOfDay, endOfDay } = getIstanbulTodayBounds();
    
    // Query the userPostLimits collection for today's record
    const querySnapshot = await adminDb.collection('userPostLimits')
      .where('userId', '==', userId)
      .where('date', '>=', Timestamp.fromDate(startOfDay))
      .where('date', '<=', Timestamp.fromDate(endOfDay))
      .get();
    
    if (querySnapshot.empty) {
      // No record for today, user hasn't posted yet
      return {
        canPost: true,
        remainingPosts: DAILY_POST_LIMIT,
        postsToday: 0
      };
    }
    
    // Get the first (and should be only) document
    const limitDoc = querySnapshot.docs[0];
    const data = limitDoc.data();
    const postsToday = data.postCount || 0;
    const remainingPosts = Math.max(0, DAILY_POST_LIMIT - postsToday);
    
    return {
      canPost: remainingPosts > 0,
      remainingPosts,
      postsToday
    };
  } catch (error) {
    console.error('Error checking daily post limit:', error);
    // In case of error, be conservative and don't allow posting
    return {
      canPost: false,
      remainingPosts: 0,
      postsToday: 0
    };
  }
}

/**
 * Increment the post count for a user for today
 * @param userId - The ID of the user
 * @returns Success status
 */
export async function incrementUserPostCount(userId: string): Promise<boolean> {
  try {
    const { startOfDay, endOfDay } = getIstanbulTodayBounds();
    
    // Query for today's record
    const querySnapshot = await adminDb.collection('userPostLimits')
      .where('userId', '==', userId)
      .where('date', '>=', Timestamp.fromDate(startOfDay))
      .where('date', '<=', Timestamp.fromDate(endOfDay))
      .get();
    
    if (querySnapshot.empty) {
      // Create new record for today
      await adminDb.collection('userPostLimits').add({
        userId,
        date: FieldValue.serverTimestamp(),
        postCount: 1,
        lastPostAt: FieldValue.serverTimestamp()
      });
    } else {
      // Update existing record
      const limitDoc = querySnapshot.docs[0];
      const currentCount = limitDoc.data().postCount || 0;
      
      await adminDb.collection('userPostLimits').doc(limitDoc.id).update({
        postCount: currentCount + 1,
        lastPostAt: FieldValue.serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error incrementing post count:', error);
    return false;
  }
}
