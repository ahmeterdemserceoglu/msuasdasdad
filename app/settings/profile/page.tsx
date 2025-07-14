'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Camera,
  User,
  MapPin,
  Calendar,
  FileText,
  Save,
  Loader2,
  Clock,
  Building
} from 'lucide-react';
import XLayout from '@/app/components/layout/XLayout';
import Image from 'next/image';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    city: '',
    birthYear: '',
    interviewDate: '',
    interviewTime: '',
    interviewCity: '',
    interviewBranch: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      let dateString = '';
      if (user.interviewDate) {
        try {
          // user.interviewDate is a Date object from auth-context
          const dateObj = new Date(user.interviewDate);
          if (!isNaN(dateObj.getTime())) {
            dateString = dateObj.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error("Could not process interviewDate", user.interviewDate, e);
        }
      }

      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        city: user.city || '',
        birthYear: user.birthYear?.toString() || '',
        interviewDate: dateString,
        interviewTime: user.interviewTime || '',
        interviewCity: user.interviewCity || '',
        interviewBranch: user.interviewBranch || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fotoğraf boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('photo', file);

      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/users/update-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Fotoğraf yükleme başarısız');
      }

      const data = await response.json();
      toast.success('Profil fotoğrafı güncellendi');

      // Reload to update auth context
      window.location.reload();
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Fotoğraf yüklenirken hata oluştu');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !firebaseUser) return;

    // Validation
    if (!formData.displayName.trim()) {
      toast.error('İsim alanı zorunludur');
      return;
    }

    if (formData.birthYear) {
      const birthYear = parseInt(formData.birthYear);
      if (isNaN(birthYear) || birthYear < 1950 || birthYear > new Date().getFullYear() - 10) {
        toast.error('Geçerli bir doğum yılı girin');
        return;
      }
    }

    if (formData.bio.length > 200) {
      toast.error('Bio 200 karakterden uzun olamaz');
      return;
    }

    setLoading(true);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/users/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: formData.displayName.trim(),
          bio: formData.bio.trim(),
          city: formData.city.trim(),
          birthYear: formData.birthYear ? parseInt(formData.birthYear) : null,
          interviewDate: formData.interviewDate.trim(),
          interviewTime: formData.interviewTime.trim(),
          interviewCity: formData.interviewCity.trim(),
          interviewBranch: formData.interviewBranch.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Profil güncelleme başarısız');
      }

      toast.success('Profil başarıyla güncellendi');

      // Reload to update auth context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Profil güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <XLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-[var(--primary)]" />
        </div>
      </XLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <XLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[var(--card-hover)] rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Profili Düzenle</h1>
          </div>
        </div>

        {/* Profile Photo Section */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Camera className="mr-2" size={20} />
            Profil Fotoğrafı
          </h2>

          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || ''}
                    width={96}
                    height={96}
                    className="w-24 h-24 object-cover"
                  />
                ) : (
                  user.displayName?.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="animate-spin h-6 w-6 text-white" />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="photo-upload"
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] cursor-pointer inline-block transition-colors"
              >
                Fotoğraf Değiştir
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
              <p className="text-xs text-[var(--muted)] mt-2">
                JPG, PNG veya GIF. Maksimum 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="mr-2" size={20} />
              Temel Bilgiler
            </h2>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  İsim *
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  required
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Hakkımda
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                  placeholder="Kendinizden bahsedin..."
                  maxLength={200}
                />
                <p className="text-xs text-[var(--muted)] mt-1 text-right">
                  {formData.bio.length}/200
                </p>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <MapPin size={16} className="mr-1" />
                  Şehir
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  placeholder="İstanbul, Ankara, İzmir..."
                />
              </div>

              {/* Birth Year */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Calendar size={16} className="mr-1" />
                  Doğum Yılı
                </label>
                <input
                  type="number"
                  name="birthYear"
                  value={formData.birthYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  placeholder="1990"
                  min="1950"
                  max={new Date().getFullYear() - 10}
                />
              </div>
            </div>
          </div>

          {/* Interview Information */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Building className="mr-2" size={20} />
              Mülakat Bilgileri
            </h2>

            <div className="space-y-4">
              {/* Interview Date */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Calendar size={16} className="mr-1" />
                  Mülakat Tarihi
                </label>
                <input
                  type="date"
                  name="interviewDate"
                  value={formData.interviewDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>

              {/* Interview Time */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Clock size={16} className="mr-1" />
                  Mülakat Saati
                </label>
                <input
                  type="time"
                  name="interviewTime"
                  value={formData.interviewTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>

              {/* Interview City */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <MapPin size={16} className="mr-1" />
                  Mülakat Şehri
                </label>
                <input
                  type="text"
                  name="interviewCity"
                  value={formData.interviewCity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  placeholder="İstanbul, Ankara, İzmir..."
                />
              </div>

              {/* Interview Branch */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Building size={16} className="mr-1" />
                  Mülakat Branşı
                </label>
                <select
                  name="interviewBranch"
                  value={formData.interviewBranch}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="">Branş seçin</option>
                  <option value="subay">Subay</option>
                  <option value="Kara Harp Okulu">Kara Harp Okulu</option>
                  <option value="Deniz Harp Okulu">Deniz Harp Okulu</option>
                  <option value="Hava Harp Okulu">Hava Harp Okulu</option>
                  <option value="diğer">Diğer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Account Info (Read-only) */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="mr-2" size={20} />
              Hesap Bilgileri
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-[var(--muted)]">E-posta</p>
                <p className="font-medium">{user.email}</p>
              </div>

              <div>
                <p className="text-sm text-[var(--muted)]">Kullanıcı ID</p>
                <p className="font-mono text-sm">{user.uid}</p>
              </div>

              <div>
                <p className="text-sm text-[var(--muted)]">Kayıt Tarihi</p>
                <p className="font-medium">
                  {user.createdAt && new Date(user.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={16} />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </XLayout>
  );
}
