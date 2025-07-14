// Firebase Auth hata kodları için Türkçe hata mesajları
export const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    // Giriş hataları
    'auth/user-not-found': 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı. Lütfen e-posta adresinizi kontrol edin veya kayıt olun.',
    'auth/wrong-password': 'Girdiğiniz şifre yanlış. Lütfen tekrar deneyin veya şifrenizi sıfırlayın.',
    'auth/invalid-email': 'Geçersiz e-posta adresi formatı. Lütfen doğru formatta bir e-posta adresi girin.',
    'auth/user-disabled': 'Bu hesap devre dışı bırakılmış. Lütfen destek ile iletişime geçin.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.',
    
    // Kayıt hataları
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanımda. Lütfen farklı bir e-posta adresi deneyin veya giriş yapın.',
    'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter uzunluğunda, büyük harf, küçük harf ve rakam içeren bir şifre seçin.',
    'auth/operation-not-allowed': 'E-posta/şifre ile kayıt şu anda devre dışı. Lütfen Google ile kayıt olun.',
    
    // Google giriş hataları
    'auth/popup-closed-by-user': 'Google giriş penceresi kapatıldı. Lütfen tekrar deneyin.',
    'auth/popup-blocked': 'Tarayıcınız pop-up pencerelerini engelliyor. Lütfen pop-up engelleyiciyi devre dışı bırakın.',
    'auth/cancelled-popup-request': 'Google ile giriş işlemi iptal edildi.',
    'auth/unauthorized-domain': 'Bu domain Google girişi için yetkilendirilmemiş.',
    'auth/account-exists-with-different-credential': 'Bu e-posta adresi farklı bir yöntemle kayıtlı. Lütfen e-posta/şifre ile giriş yapın.',
    
    // Şifre sıfırlama hataları
    'auth/missing-email': 'E-posta adresi eksik. Lütfen bir e-posta adresi girin.',
    'auth/invalid-action-code': 'Geçersiz veya süresi dolmuş bağlantı. Lütfen yeni bir şifre sıfırlama talebi oluşturun.',
    
    // Genel hatalar
    'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen birkaç dakika bekleyip tekrar deneyin.',
    'auth/network-request-failed': 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
    'auth/internal-error': 'Bir sistem hatası oluştu. Lütfen daha sonra tekrar deneyin.',
    'auth/requires-recent-login': 'Bu işlem için yeniden giriş yapmanız gerekiyor.',
    
    // Varsayılan mesaj
    'default': 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
  };

  return errorMessages[errorCode] || errorMessages['default'];
};

// Form validasyon hata mesajları
export const getValidationErrorMessage = (field: string, type: string): string => {
  const validationMessages: { [key: string]: { [key: string]: string } } = {
    email: {
      required: 'E-posta adresi gereklidir.',
      format: 'Geçerli bir e-posta adresi girin. Örnek: kullanici@email.com'
    },
    password: {
      required: 'Şifre gereklidir.',
      minLength: 'Şifre en az 6 karakter olmalıdır.',
      strength: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.'
    },
    confirmPassword: {
      required: 'Şifre tekrarı gereklidir.',
      match: 'Girdiğiniz şifreler eşleşmiyor. Lütfen aynı şifreyi girin.'
    },
    displayName: {
      required: 'Ad soyad gereklidir.',
      minLength: 'Ad soyad en az 3 karakter olmalıdır.',
      format: 'Ad soyad sadece harf ve boşluk içermelidir.'
    },
    birthYear: {
      required: 'Doğum yılı gereklidir.',
      format: 'Doğum yılı sayı olmalıdır.',
      minValue: 'Doğum yılı 1990\'dan küçük olamaz.',
      maxValue: 'Doğum yılı 2010\'dan büyük olamaz.',
      age: 'MSÜ Rehber\'e kayıt olabilmek için en az 14 yaşında olmalısınız.'
    }
  };

  return validationMessages[field]?.[type] || 'Geçersiz değer.';
};
