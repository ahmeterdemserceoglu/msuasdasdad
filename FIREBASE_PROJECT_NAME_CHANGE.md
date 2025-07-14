# Firebase Proje Adını Değiştirme

Firebase'de görünen "millisavunmauniversitesi-6b95a.firebaseapp.com" adını "MSÜ Rehber" olarak değiştirmek için aşağıdaki adımları izleyin:

## 1. Firebase Console'da Proje Adını Güncelleme

1. [Firebase Console](https://console.firebase.google.com)'a gidin
2. Projenizi seçin (millisavunmauniversitesi-6b95a)
3. Sol menüden **Proje Ayarları** (Project Settings) sekmesine tıklayın
4. **Genel** (General) sekmesinde:
   - **Herkese açık ad** (Public-facing name) alanını bulun
   - Bu alanı **"MSÜ Rehber"** olarak değiştirin
   - **Kaydet** butonuna tıklayın

## 2. Firebase Hosting Özel Domain (İsteğe Bağlı)

Eğer özel bir domain kullanmak isterseniz:

1. Firebase Console'da **Hosting** sekmesine gidin
2. **Domain ekle** (Add custom domain) butonuna tıklayın
3. Örnek: `msurehber.com` veya `msu-rehber.com`
4. DNS ayarlarını yapın

## 3. OAuth İzin Ekranını Güncelleme

Google ile giriş yapıldığında görünen adı değiştirmek için:

1. [Google Cloud Console](https://console.cloud.google.com)'a gidin
2. Firebase projenizi seçin
3. Sol menüden **APIs & Services** > **OAuth consent screen**'e gidin
4. **Edit App** butonuna tıklayın
5. **Application name** alanını **"MSÜ Rehber"** olarak değiştirin
6. **Save and Continue** ile kaydedin

## 4. Firebase Authentication Email Şablonları

1. Firebase Console'da **Authentication** > **Templates** sekmesine gidin
2. Her bir email şablonunu düzenleyin:
   - Password reset
   - Email address verification
   - Email address change
3. Şablonlarda "millisavunmauniversitesi" yerine "MSÜ Rehber" yazın
4. **Sender name** alanını "MSÜ Rehber" olarak değiştirin

## Notlar

- Firebase proje ID'si (`millisavunmauniversitesi-6b95a`) değiştirilemez
- Ancak kullanıcıların gördüğü tüm yerler "MSÜ Rehber" olarak güncellenebilir
- Web uygulaması meta verileri zaten güncellendi
