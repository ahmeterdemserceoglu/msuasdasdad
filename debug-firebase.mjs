const admin = require('firebase-admin');

// Environment değişkenlerini yükle
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Firebase Debug Scripti Başlatılıyor...\n');

// Environment değişkenlerini kontrol et
console.log('📋 Environment Değişkenleri:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Mevcut' : '❌ Eksik');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Mevcut' : '❌ Eksik');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Mevcut' : '❌ Eksik');
console.log();

try {
  // Firebase Admin SDK'yı initialize et
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log('✅ Firebase Admin SDK başarıyla initialize edildi');
  }

  // Firestore bağlantısını test et
  const db = admin.firestore();
  
  console.log('\n🔗 Firestore bağlantısı test ediliyor...');
  
  // Test collection'a yazma ve okuma dene
  const testRef = db.collection('_test').doc('connection');
  
  await testRef.set({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    test: true
  });
  
  const testDoc = await testRef.get();
  
  if (testDoc.exists) {
    console.log('✅ Firestore yazma/okuma başarılı');
    // Test dokümanını sil
    await testRef.delete();
    console.log('✅ Test dokümanı temizlendi');
  }

  // Auth servisini test et
  console.log('\n🔐 Firebase Auth servisi test ediliyor...');
  
  // Kullanıcıları listele (ilk 1 kullanıcı)
  const listUsers = await admin.auth().listUsers(1);
  console.log('✅ Firebase Auth erişimi başarılı');
  console.log(`📊 Toplam kullanıcı sayısı: ${listUsers.users.length > 0 ? 'En az 1' : '0'}`);

  // Admin kullanıcıları kontrol et
  console.log('\n👑 Admin kullanıcıları kontrol ediliyor...');
  
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
  
  for (const email of adminEmails) {
    try {
      const user = await admin.auth().getUserByEmail(email.trim());
      console.log(`✅ ${email}: Firebase Auth'da mevcut`);
      
      // Custom claims kontrol et
      const customClaims = user.customClaims || {};
      console.log(`   Custom Claims: isAdmin = ${customClaims.isAdmin || false}`);
      
      // Firestore dokümanını kontrol et
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`   Firestore: isAdmin = ${userData.isAdmin || false}`);
      } else {
        console.log(`   ⚠️  Firestore'da kullanıcı dokümanı bulunamadı`);
      }
      
    } catch (error) {
      console.log(`❌ ${email}: ${error.message}`);
    }
  }

  console.log('\n✅ Tüm kontroller tamamlandı!');

} catch (error) {
  console.error('❌ Hata:', error.message);
  console.error('Detay:', error);
}

process.exit(0);
