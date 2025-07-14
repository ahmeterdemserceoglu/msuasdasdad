'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import Card from '@/app/components/ui/Card';
import XLayout from '@/app/components/layout/XLayout';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // useTheme kancası client-side'da çalıştığı için mounted state'i kullanıyoruz
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const themeOptions = [
    {
      value: 'light',
      label: 'Açık Tema',
      icon: Sun,
      description: 'Gündüz kullanımı için aydınlık tema'
    },
    {
      value: 'dark',
      label: 'Koyu Tema',
      icon: Moon,
      description: 'Gece kullanımı için karanlık tema'
    },
    {
      value: 'system',
      label: 'Sistem Teması',
      icon: Monitor,
      description: 'Cihazınızın tema ayarını kullan'
    }
  ];

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(`Tema ${newTheme === 'light' ? 'açık' : newTheme === 'dark' ? 'koyu' : 'sistem'} olarak değiştirildi`);
  };

  return (
    <XLayout>
      <div className="p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Ayarlar</h1>
          <p className="text-gray-600 dark:text-gray-400">Uygulama tercihlerinizi özelleştirin</p>
        </div>

      {/* Tema Ayarları */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Tema Tercihi</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Uygulamanın görünümünü tercihlerinize göre özelleştirin
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-blue-500 rounded-full p-1">
                      <Check size={12} className="text-white" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center space-y-3">
                  <Icon
                    size={32}
                    className={isSelected ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}
                  />
                  <div className="text-center">
                    <h3 className={`font-medium ${
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {option.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Profil Bilgileri */}
      {user && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Profil Bilgileri</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Ad Soyad</label>
              <p className="text-gray-900 dark:text-gray-100">{user.displayName || 'Belirtilmemiş'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">E-posta</label>
              <p className="text-gray-900 dark:text-gray-100">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Üyelik Tarihi</label>
              <p className="text-gray-900 dark:text-gray-100">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
              </p>
            </div>
          </div>
        </Card>
      )}
      </div>
    </XLayout>
  );
}
