'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Mail, Lock, Shield, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Form validasyonu
    if (!email || !password) {
      setError('Lütfen e-posta ve şifre alanlarını doldurun.');
      setLoading(false);
      return;
    }

    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      setLoading(false);
      return;
    }

    // Şifre uzunluk kontrolü
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      setLoading(false);
      return;
    }

    try {
      await signIn(email, password);
      router.push('/');
    } catch (error: Error) {
      console.error('Login error:', error);
      
      // Firebase Auth hata kodlarına göre detaylı mesajlar
      switch (error.code) {
        case 'auth/user-not-found':
          setError('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı. Lütfen kayıt olun veya e-posta adresinizi kontrol edin.');
          break;
        case 'auth/wrong-password':
          setError('Girdiğiniz şifre yanlış. Lütfen tekrar deneyin veya şifrenizi sıfırlayın.');
          break;
        case 'auth/invalid-email':
          setError('Geçersiz e-posta adresi formatı. Lütfen e-posta adresinizi kontrol edin.');
          break;
        case 'auth/user-disabled':
          setError('Bu hesap devre dışı bırakılmış. Lütfen destek ile iletişime geçin.');
          break;
        case 'auth/too-many-requests':
          setError('Çok fazla başarısız deneme. Lütfen birkaç dakika bekleyip tekrar deneyin.');
          break;
        case 'auth/network-request-failed':
          setError('İnternet bağlantınızı kontrol edin ve tekrar deneyin.');
          break;
        case 'auth/invalid-credential':
          setError('E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.');
          break;
        case 'auth/operation-not-allowed':
          setError('E-posta/şifre ile giriş devre dışı. Lütfen Google ile giriş yapın.');
          break;
        case 'auth/requires-recent-login':
          setError('Bu işlem için yeniden giriş yapmanız gerekiyor.');
          break;
        default:
          setError(`Giriş yapılırken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      // Google ile giriş sonrası doğum yılı kontrolü yapılacak
      // Bu kontrol auth-context'te yapılıyor
      router.push('/');
    } catch (error: Error) {
      console.error('Google login error:', error);
      
      // Google Sign-In hata kodlarına göre detaylı mesajlar
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          setError('Google giriş penceresi kapatıldı. Lütfen tekrar deneyin.');
          break;
        case 'auth/popup-blocked':
          setError('Tarayıcınız pop-up pencerelerini engelliyor. Lütfen pop-up engelleyiciyi devre dışı bırakın.');
          break;
        case 'auth/cancelled-popup-request':
          setError('Google ile giriş işlemi iptal edildi.');
          break;
        case 'auth/network-request-failed':
          setError('İnternet bağlantınızı kontrol edin ve tekrar deneyin.');
          break;
        case 'auth/unauthorized-domain':
          setError('Bu domain Google girişi için yetkilendirilmemiş.');
          break;
        case 'auth/user-disabled':
          setError('Bu Google hesabı devre dışı bırakılmış.');
          break;
        default:
          setError(`Google ile giriş yapılırken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
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
          <h1 className="text-3xl font-bold text-white mb-2">Hoş Geldiniz</h1>
          <p className="text-military-beige/80">MSÜ Rehber'e giriş yapın</p>
        </div>

        <Card variant="elevated" className="backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
          <CardHeader>
            <CardTitle className="text-center">Giriş Yap</CardTitle>
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
                type="email"
                label="E-posta Adresi"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon={<Mail className="h-5 w-5 text-gray-400" />}
              />

              <Input
                type="password"
                label="Şifre"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={<Lock className="h-5 w-5 text-gray-400" />}
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-military-green focus:ring-military-green"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Beni hatırla
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-military-green hover:underline"
                >
                  Şifremi unuttum
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={loading}
                disabled={loading}
              >
                Giriş Yap
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
                onClick={handleGoogleSignIn}
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
                Google ile Giriş Yap
              </Button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="text-military-green hover:underline font-medium">
                Kayıt olun
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
