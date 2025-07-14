# MSU Mülakat API Scripts

Bu klasördeki PowerShell scriptleri, API route'larını kolayca oluşturmanızı ve yönetmenizi sağlar.

## 🚀 Kullanım

### 1. API Route Oluşturma

```powershell
# Basit bir route oluştur
.\scripts\create-api-route.ps1 -RouteName "users"

# Auth gerektiren route
.\scripts\create-api-route.ps1 -RouteName "profile" -WithAuth

# Validation'lı route
.\scripts\create-api-route.ps1 -RouteName "applications" -WithValidation

# Tüm özelliklerle
.\scripts\create-api-route.ps1 -RouteName "interviews" -Method "GET,POST,PUT,DELETE" -WithAuth -WithValidation

# Sadece belirli metodlarla
.\scripts\create-api-route.ps1 -RouteName "reports" -Method "GET" -WithAuth
```

### 2. Mevcut Route'ları Listeleme

```powershell
.\scripts\list-api-routes.ps1
```

## 📋 Örnekler

### Kullanıcı Yönetimi API'si
```powershell
.\scripts\create-api-route.ps1 -RouteName "users" -Method "GET,POST,PUT,DELETE" -WithAuth -WithValidation
```

### Mülakat API'si
```powershell
.\scripts\create-api-route.ps1 -RouteName "interviews" -Method "GET,POST,PUT" -WithAuth -WithValidation
```

### Başvuru API'si
```powershell
.\scripts\create-api-route.ps1 -RouteName "applications" -Method "GET,POST,PUT" -WithAuth -WithValidation
```

### Bildirim API'si
```powershell
.\scripts\create-api-route.ps1 -RouteName "notifications" -Method "GET,POST" -WithAuth
```

### Raporlama API'si
```powershell
.\scripts\create-api-route.ps1 -RouteName "analytics" -Method "GET" -WithAuth
```

## 🔧 Parametreler

- **RouteName** (Zorunlu): API route'un adı (örn: "users", "posts")
- **Method**: HTTP metodları, virgülle ayrılmış (Varsayılan: "GET,POST")
- **WithAuth**: Authentication gereksin mi? (Switch parametre)
- **WithValidation**: Zod validation eklensin mi? (Switch parametre)

## 📁 Oluşturulan Dosya Yapısı

```
app/api/
├── [route-name]/
│   ├── route.ts          # Ana route dosyası
│   └── [id]/
│       └── route.ts      # Dynamic route (PUT, DELETE için)
```

## 🎯 Özellikler

- ✅ Otomatik klasör ve dosya oluşturma
- 🔐 Authentication desteği
- ✔️ Validation şemaları (Zod)
- 📄 TypeScript tip güvenliği
- 🔥 Firebase Firestore entegrasyonu
- 📝 CRUD operasyonları
- 🎨 Temiz kod yapısı

## 💡 İpuçları

1. Route oluşturduktan sonra validation şemalarını düzenleyin
2. Auth kontrolü için `app/lib/auth.ts` dosyasını özelleştirin
3. Firestore collection isimlerini route isimleriyle aynı tutun
4. Error handling'i projenize göre özelleştirin

## 🛠️ Geliştirme

Yeni özellikler eklemek için script'leri düzenleyebilirsiniz:
- Middleware desteği
- Custom error handling
- Rate limiting
- Caching
- WebSocket desteği
