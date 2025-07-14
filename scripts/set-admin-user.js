const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function setAdminStatus(userId, isAdmin = true) {
  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({ isAdmin });
    console.log(`Admin status for user ${userId} set to ${isAdmin}`);
    
    // Also set custom claims
    await admin.auth().setCustomUserClaims(userId, { admin: isAdmin });
    console.log(`Custom claims updated for user ${userId}`);
  } catch (error) {
    console.error('Error setting admin status:', error);
  }
}

async function checkAdminStatus(userId) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`User ${userId} admin status: ${userData.isAdmin}`);
      
      // Check custom claims
      const userRecord = await admin.auth().getUser(userId);
      console.log(`User ${userId} custom claims:`, userRecord.customClaims);
    } else {
      console.log(`User ${userId} not found`);
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const command = args[0];
const userId = args[1];

if (!command || !userId) {
  console.log('Usage: node set-admin-user.js <check|set|remove> <userId>');
  process.exit(1);
}

switch (command) {
  case 'check':
    checkAdminStatus(userId);
    break;
  case 'set':
    setAdminStatus(userId, true);
    break;
  case 'remove':
    setAdminStatus(userId, false);
    break;
  default:
    console.log('Invalid command. Use: check, set, or remove');
}
