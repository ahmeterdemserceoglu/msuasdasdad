'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Mail, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // E-posta kontrolü
    if (!email || email.trim() === '') {
      setError('Lütfen e-posta adresinizi girin.');
      return;
    }

    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Geçerli bir e-posta adresi girin. Örnek: kullanici@email.com');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success('Şifre sıfırlama bağlantısı başarıyla gönderildi!');
} catch (e: unknown) {
      const error = e as { code?: string; message: string };
      console.error('Password reset error:', error);
      
      // Firebase Auth hata kodlarına göre detaylı mesajlar
      switch (error.code) {
        case 'auth/user-not-found':
          setError('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı. Lütfen e-posta adresinizi kontrol edin veya kayıt olun.');
          break;
        case 'auth/invalid-email':
          setError('Geçersiz e-posta adresi formatı. Lütfen doğru formatta bir e-posta adresi girin.');
          break;
        case 'auth/missing-email':
          setError('E-posta adresi eksik. Lütfen bir e-posta adresi girin.');
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
        case 'auth/internal-error':
          setError('Bir sistem hatası oluştu. Lütfen daha sonra tekrar deneyin.');
          break;
        case 'auth/invalid-action-code':
          setError('Geçersiz veya süresi dolmuş bağlantı. Lütfen yeni bir şifre sıfırlama talebi oluşturun.');
          break;
        default:
          setError(`Şifre sıfırlama e-postası gönderilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
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
          <h1 className="text-3xl font-bold text-white mb-2">Şifre Sıfırlama</h1>
          <p className="text-military-beige/80">Yeni şifre oluşturun</p>
        </div>

        <Card variant="elevated" className="backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
          <CardHeader>
            <CardTitle className="text-center">Şifremi Unuttum</CardTitle>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-800 dark:text-green-200">
                    Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-2">
                    Lütfen e-postanızı kontrol edin ve gelen talimatlara uyun.
                  </p>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  E-posta gelmedi mi? Spam klasörünü kontrol edin veya birkaç dakika bekleyin.
                </p>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                >
                  Tekrar Dene
                </Button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    E-posta adresinizi girin. Size şifrenizi sıfırlayabileceğiniz bir bağlantı göndereceğiz.
                  </p>

                  <Input
                    type="email"
                    label="E-posta Adresi"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    icon={<Mail className="h-5 w-5 text-gray-400" />}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={loading}
                    disabled={loading}
                  >
                    Şifre Sıfırlama Bağlantısı Gönder
                  </Button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center text-sm text-military-green hover:underline"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Giriş sayfasına dön
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
