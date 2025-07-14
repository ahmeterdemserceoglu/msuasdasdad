# Firebase Kurulum Adımları

## 1. Firebase Projecti Oluşturma
- Firebase Console'a gidin ve yeni bir proje oluşturun.

## 2. Web Uygulaması Oluşturma
- Yeni bir web uygulaması ekleyin ve proje ayarlarından konfigürasyon snippet'ini kopyalayın.

## 3. Authentication Ayarları
1. Authentication sekmesine gidin.
2. Sign-in Method bölümünden Email/Password ve Google yöntemlerini etkinleştirin.

## 4. Firestore Veritabanı Oluşturma
- Firestore Database'i oluşturun ve kurallar kısmına `firestore.rules` dosyasını yükleyin.

## 5. Storage Bucket Oluşturma
1. Storage sekmesine gidin ve yeni bir bucket oluşturun.
2. Kuralları düzenleyin ve `storage.rules` dosyasını yükleyin.

## 6. .env Dosyasını Düzenleme
- `msu-mulakat` dizininde `.env.local` dosyasını oluşturun ve Firebase konfigürasyon bilgilerini ekleyin.

### Örnek Yapı
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 7. Firebase CLI Kullanarak Deploy Etme
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

