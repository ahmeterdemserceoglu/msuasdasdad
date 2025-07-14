'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { db, storage } from '@/app/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { User, Calendar, Mail, Camera, Shield, ArrowLeft, MapPin, Users, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    birthYear: '',
    interviewDate: '',
    interviewTime: '',
    interviewCity: '',
    interviewBranch: '' as any,
  });
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        birthYear: user.birthYear?.toString() || '',
        interviewDate: user.interviewDate ? (() => {
          try {
            let date;
            // Firestore Timestamp kontrolü
            if (user.interviewDate && typeof user.interviewDate === 'object' && 'toDate' in user.interviewDate) {
              date = user.interviewDate.toDate();
            } else if (user.interviewDate instanceof Date) {
              date = user.interviewDate;
            } else if (typeof user.interviewDate === 'string' || typeof user.interviewDate === 'number') {
              date = new Date(user.interviewDate);
            } else {
              return '';
            }
            
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Invalid interview date:', user.interviewDate);
          }
          return '';
        })() : '',
        interviewTime: user.interviewDate ? (() => {
          try {
            let date;
            // Firestore Timestamp kontrolü
            if (user.interviewDate && typeof user.interviewDate === 'object' && 'toDate' in user.interviewDate) {
              date = user.interviewDate.toDate();
            } else if (user.interviewDate instanceof Date) {
              date = user.interviewDate;
            } else if (typeof user.interviewDate === 'string' || typeof user.interviewDate === 'number') {
              date = new Date(user.interviewDate);
            } else {
              return '';
            }
            
            if (!isNaN(date.getTime())) {
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              return `${hours}:${minutes}`;
            }
          } catch (e) {
            console.error('Invalid interview time:', user.interviewDate);
          }
          return '';
        })() : '',
        interviewCity: user.interviewCity || '',
        interviewBranch: user.interviewBranch || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Fotoğraf boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !firebaseUser) return null;
    
    setUploading(true);
    try {
      const storageRef = ref(storage, `users/${firebaseUser.uid}/profile.jpg`);
      await uploadBytes(storageRef, photoFile);
      const photoURL = await getDownloadURL(storageRef);
      
      // Firebase Auth profilini güncelle
      await updateProfile(firebaseUser, { photoURL });
      
      return photoURL;
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Fotoğraf yüklenirken bir hata oluştu.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !firebaseUser) return;

    const birthYear = parseInt(formData.birthYear);
    if (isNaN(birthYear) || birthYear < 1990 || birthYear > 2010) {
      toast.error('Doğum yılı 1990-2010 arasında olmalıdır.');
      return;
    }

    setUpdating(true);

    try {
      // Fotoğraf yükleme
      let photoURL = user.photoURL;
      if (photoFile) {
        const uploadedPhotoURL = await uploadPhoto();
        if (uploadedPhotoURL) {
          photoURL = uploadedPhotoURL;
        }
      }

      // Firebase Auth profilini güncelle
      if (formData.displayName !== firebaseUser.displayName) {
        await updateProfile(firebaseUser, { displayName: formData.displayName });
      }

      // Firestore'u güncelle
      const updateData: any = {
        displayName: formData.displayName,
        birthYear,
      };
      
      // Mülakat tarihini ve saatini ekle
      if (formData.interviewDate) {
        const dateStr = formData.interviewDate;
        const timeStr = formData.interviewTime || '09:00';
        const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
        
        const interviewDateTime = new Date(dateStr);
        interviewDateTime.setHours(hours, minutes, 0, 0);
        
        updateData.interviewDate = interviewDateTime;
      }
      
      // Mülakat şehri ve branşını ekle
      if (formData.interviewCity) {
        updateData.interviewCity = formData.interviewCity;
      }
      if (formData.interviewBranch) {
        updateData.interviewBranch = formData.interviewBranch;
      }
      
      if (photoURL !== user.photoURL) {
        updateData.photoURL = photoURL;
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);

      // Kullanıcı bilgilerini yeniden yükle
      const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (updatedUserDoc.exists()) {
        const updatedData = updatedUserDoc.data();
        // Auth context'i güncellemek için sayfayı yenile
        window.location.reload();
      }

      toast.success('Profil başarıyla güncellendi!');
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Profil güncellenirken bir hata oluştu.');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-green"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-military-green transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Ana Sayfaya Dön
          </Link>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-military-green" />
              Profil Bilgilerim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profil Fotoğrafı */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {photoPreview || user.photoURL ? (
                      <Image
                        src={photoPreview || user.photoURL || ''}
                        alt="Profil fotoğrafı"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label 
                    htmlFor="photo-upload" 
                    className="absolute bottom-0 right-0 bg-military-green text-white p-2 rounded-full cursor-pointer hover:bg-military-green/90 transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {photoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                  >
                    Fotoğrafı Kaldır
                  </Button>
                )}
              </div>

              {/* E-posta (Salt okunur) */}
              <Input
                type="email"
                label="E-posta Adresi"
                value={user.email}
                disabled
                readOnly
                icon={<Mail className="h-5 w-5 text-gray-400" />}
              />

              {/* Ad Soyad */}
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

              {/* Doğum Yılı */}
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

              {/* Mülakat Tarihi ve Saati */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mülakat Tarihi
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      name="interviewDate"
                      value={formData.interviewDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Sadece bugün ve sonraki tarihler seçilebilir
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mülakat Saati
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      name="interviewTime"
                      value={formData.interviewTime}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Mülakat saatini belirtin
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 -mt-2">
                <span className="font-medium">💡 İpucu:</span> Mülakat bilgilerinizi girerek aynı tarihteki diğer adaylarla tanışabilirsiniz
              </p>

              {/* Mülakat Şehri */}
              <Input
                type="text"
                name="interviewCity"
                label="Mülakat Şehri"
                placeholder="Örn: Ankara"
                value={formData.interviewCity}
                onChange={handleChange}
                icon={<MapPin className="h-5 w-5 text-gray-400" />}
              />

              {/* Mülakat Branşı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mülakat Branşı
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    name="interviewBranch"
                    value={formData.interviewBranch}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewBranch: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    <option value="subay">Subay</option>
                    <option value="astsubay">Astsubay</option>
                    <option value="harbiye">Harbiye</option>
                    <option value="sahil-guvenlik">Sahil Güvenlik</option>
                    <option value="jandarma">Jandarma</option>
                  </select>
                </div>
              </div>

              {/* Admin Durumu */}
              {user.isAdmin && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-800 dark:text-green-200 font-medium flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Yetkilerine Sahipsiniz
                  </p>
                </div>
              )}

              {/* Mülakat ve Kayıt Bilgileri */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                {user.interviewDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Mülakat Tarihi:</span>
                    <span className="text-[var(--foreground)] font-semibold">
                      {(() => {
                        try {
                          let date;
                          if (user.interviewDate && typeof user.interviewDate === 'object' && 'toDate' in user.interviewDate) {
                            date = user.interviewDate.toDate();
                          } else if (user.interviewDate instanceof Date) {
                            date = user.interviewDate;
                          } else {
                            date = new Date(user.interviewDate);
                          }
                          
                          return date.toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch (e) {
                          return 'Geçersiz tarih';
                        }
                      })()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Kayıt Tarihi:</span>
                  <span className="text-[var(--foreground)]">
                    {
                      user.createdAt ? (
                        // Firestore Timestamp veya Date nesnesini kontrol et
                        typeof user.createdAt === 'object' && 'toDate' in user.createdAt
                          ? user.createdAt.toDate().toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : new Date(user.createdAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                      ) : 'Bilinmiyor'
                    }
                  </span>
                </div>
              </div>

              {/* Güncelle Butonu */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={updating || uploading}
                disabled={updating || uploading}
              >
                {uploading ? 'Fotoğraf Yükleniyor...' : 'Profili Güncelle'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
