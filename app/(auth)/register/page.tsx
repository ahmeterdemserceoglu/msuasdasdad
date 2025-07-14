'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Mail, Lock, User, Shield, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    birthYear: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    // Ad Soyad kontrolü
    if (!formData.displayName || formData.displayName.trim().length < 3) {
      setError('Ad soyad en az 3 karakter olmalıdır.');
      return false;
    }

    // Ad Soyad format kontrolü (sadece harf ve boşluk)
    const nameRegex = /^[a-zA-ZğüşöçıİĞÜŞÖÇ\s]+$/;
    if (!nameRegex.test(formData.displayName)) {
      setError('Ad soyad sadece harf ve boşluk içermelidir.');
      return false;
    }

    // E-posta kontrolü
    if (!formData.email) {
      setError('E-posta adresi gereklidir.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Geçerli bir e-posta adresi girin. Örnek: kullanici@email.com');
      return false;
    }

    // Şifre kontrolü
    if (!formData.password) {
      setError('Şifre gereklidir.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return false;
    }

    // Güçlü şifre kontrolü
    const hasNumber = /\d/.test(formData.password);
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    
    if (!hasNumber || !hasUpperCase || !hasLowerCase) {
      setError('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.');
      return false;
    }

    // Şifre eşleşme kontrolü
    if (!formData.confirmPassword) {
      setError('Şifre tekrarı gereklidir.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Girdiğiniz şifreler eşleşmiyor. Lütfen aynı şifreyi girin.');
      return false;
    }

    // Doğum yılı kontrolü
    if (!formData.birthYear) {
      setError('Doğum yılı gereklidir.');
      return false;
    }

    const birthYear = parseInt(formData.birthYear);
    const currentYear = new Date().getFullYear();
    
    if (isNaN(birthYear)) {
      setError('Doğum yılı sayı olmalıdır.');
      return false;
    }
    
    if (birthYear < 1990) {
      setError('Doğum yılı 1990\'dan küçük olamaz.');
      return false;
    }
    
    if (birthYear > 2010) {
      setError('Doğum yılı 2010\'dan büyük olamaz.');
      return false;
    }
    
    const age = currentYear - birthYear;
    if (age < 14) {
      setError('MSÜ Rehber\'e kayıt olabilmek için en az 14 yaşında olmalısınız.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.displayName, parseInt(formData.birthYear));
      toast.success('Hesabınız başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...');
      router.push('/');
    } catch (error: Error) {
      console.error('Register error:', error);
      
      // Firebase Auth hata kodlarına göre detaylı mesajlar
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Bu e-posta adresi zaten kullanımda. Lütfen farklı bir e-posta adresi deneyin veya giriş yapın.');
          break;
        case 'auth/weak-password':
          setError('Şifre çok zayıf. En az 6 karakter uzunluğunda, büyük harf, küçük harf ve rakam içeren bir şifre seçin.');
          break;
        case 'auth/invalid-email':
          setError('Geçersiz e-posta adresi formatı. Lütfen doğru formatta bir e-posta adresi girin.');
          break;
        case 'auth/operation-not-allowed':
          setError('E-posta/şifre ile kayıt şu anda devre dışı. Lütfen Google ile kayıt olun.');
          break;
        case 'auth/network-request-failed':
          setError('İnternet bağlantınızı kontrol edin ve tekrar deneyin.');
          break;
        case 'auth/too-many-requests':
          setError('Çok fazla başarısız deneme. Lütfen birkaç dakika bekleyip tekrar deneyin.');
          break;
        case 'auth/user-disabled':
          setError('Bu e-posta adresi engellenmiş. Lütfen destek ile iletişime geçin.');
          break;
        default:
          setError(`Kayıt olurken bir hata oluştu: ${error.message || 'Bilinmeyen hata. Lütfen tekrar deneyin.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      toast.success('Google ile başarıyla kayıt oldunuz! Doğum yılı bilginizi profilden güncellemeyi unutmayın.');
      router.push('/');
    } catch (error: Error) {
      console.error('Google signup error:', error);
      
      // Google Sign-In hata kodlarına göre detaylı mesajlar
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          setError('Google kayıt penceresi kapatıldı. Lütfen tekrar deneyin.');
          break;
        case 'auth/popup-blocked':
          setError('Tarayıcınız pop-up pencerelerini engelliyor. Lütfen pop-up engelleyiciyi devre dışı bırakın.');
          break;
        case 'auth/cancelled-popup-request':
          setError('Google ile kayıt işlemi iptal edildi.');
          break;
        case 'auth/network-request-failed':
          setError('İnternet bağlantınızı kontrol edin ve tekrar deneyin.');
          break;
        case 'auth/unauthorized-domain':
          setError('Bu domain Google girişi için yetkilendirilmemiş.');
          break;
        case 'auth/account-exists-with-different-credential':
          setError('Bu e-posta adresi farklı bir yöntemle kayıtlı. Lütfen e-posta/şifre ile giriş yapın.');
          break;
        default:
          setError(`Google ile kayıt olurken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-military-green via-military-navy to-military-green flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-military-beige" />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Hesap Oluştur</h1>
          <p className="text-military-beige/80">MSÜ Rehber'e katılın</p>
        </div>

        <Card variant="elevated" className="backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
          <CardHeader>
            <CardTitle className="text-center">Kayıt Ol</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                name="displayName"
                label="Ad Soyad"
                placeholder="Adınız ve soyadınız"
                value={formData.displayName}
                onChange={handleChange}
                required
                icon={<User className="h-5 w-5 text-gray-400" />}
              />

              <Input
                type="email"
                name="email"
                label="E-posta Adresi"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                icon={<Mail className="h-5 w-5 text-gray-400" />}
              />

              <Input
                type="password"
                name="password"
                label="Şifre"
                placeholder="En az 6 karakter"
                value={formData.password}
                onChange={handleChange}
                required
                icon={<Lock className="h-5 w-5 text-gray-400" />}
              />

              <Input
                type="password"
                name="confirmPassword"
                label="Şifre Tekrar"
                placeholder="Şifrenizi tekrar girin"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                icon={<Lock className="h-5 w-5 text-gray-400" />}
              />

              <Input
                type="number"
                name="birthYear"
                label="Doğum Yılı"
                placeholder="Örn: 2000"
                value={formData.birthYear}
                onChange={handleChange}
                required
                min="1990"
                max="2010"
                icon={<Calendar className="h-5 w-5 text-gray-400" />}
              />

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Kayıt olarak{' '}                <Link href="/terms" className="text-military-green hover:underline">                  Kullanım Şartlarını                </Link>{' '}                ve{' '}                <Link href="/privacy" className="text-military-green hover:underline">                  Gizlilik Politikasını                </Link>{' '}                kabul etmiş olursunuz.
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={loading}
                disabled={loading}
              >
                Kayıt Ol
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">veya</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                size="lg"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google ile Kayıt Ol
              </Button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="text-military-green hover:underline font-medium">
                Giriş yapın
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
