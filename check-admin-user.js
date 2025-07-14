// Firebase Console → Firestore Database'de kontrol edilecekler:
// 1. users koleksiyonuna gidin
// 2. Kullanıcı UID'nizi bulun 
// 3. İlgili dokümanda şu alanlar olmalı:
//    - isAdmin: true
//    - email: kullanıcı email'i
//    - displayName: kullanıcı adı (opsiyonel)

// Eğer users/{userUID} dokümanı yoksa, manuel olarak oluşturun:
/*
Firestore Console'da:
1. users koleksiyonuna gidin
2. "Add document" tıklayın  
3. Document ID: {your-user-uid}
4. Field'lar:
   - isAdmin: boolean = true
   - email: string = "your-email@domain.com"
   - displayName: string = "Your Name" (opsiyonel)
*/

// Alternatif olarak, bu scripti kullanarak programatik olarak ekleyebilirsiniz:
const admin = require('firebase-admin');

// Admin SDK'yı başlatın (zaten yapılandırılmışsa skip edilir)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

async function setAdminUser(uid, email) {
  try {
    // Custom claims ekle
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    // Firestore'a user dokümanı ekle
    await admin.firestore().collection('users').doc(uid).set({
      isAdmin: true,
      email: email,
      displayName: 'Admin User',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('Admin kullanıcı başarıyla ayarlandı');
  } catch (error) {
    console.error('Hata:', error);
  }
}

// Kullanım:
// setAdminUser('YOUR_USER_UID', 'your-email@domain.com');
