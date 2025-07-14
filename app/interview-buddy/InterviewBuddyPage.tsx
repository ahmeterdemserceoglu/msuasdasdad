'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp, doc, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useAuth } from '@/app/lib/auth-context';
import { User } from '@/app/types';
import { Calendar, MapPin, Users, MessageCircle, UserPlus, Circle } from 'lucide-react';
import XLayout from '@/app/components/layout/XLayout';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

const CANDIDATE_TYPE_LABELS = {
  'subay': 'Subay',
  'astsubay': 'Astsubay',
  'harbiye': 'Harbiye',
  'sahil-guvenlik': 'Sahil Güvenlik',
  'jandarma': 'Jandarma'
};

export default function InterviewBuddyPage() {
  const { user: currentUser, firebaseUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [friendshipStatus, setFriendshipStatus] = useState<Map<string, 'none' | 'pending' | 'accepted' | 'rejected'>>(
    new Map()
  );

  useEffect(() => {
    // Kullanıcının kendi mülakat tarihini al
    if (currentUser?.interviewDate) {
      const date = currentUser.interviewDate instanceof Date
        ? currentUser.interviewDate
        : new Date(currentUser.interviewDate);

      if (!isNaN(date.getTime())) {
        const dateStr = date.toISOString().split('T')[0];
        setSelectedDate(dateStr);
      }
    }
  }, [currentUser]);

  // Arkadaşlık durumunu kontrol eden fonksiyon
  const checkFriendshipStatus = async (
    fromUserId: string,
    toUserId: string
  ): Promise<'none' | 'pending' | 'accepted' | 'rejected'> => {
    try {
      // Önce mevcut arkadaşları kontrol et
      const currentUserDoc = await getDoc(doc(db, 'users', fromUserId));
      if (currentUserDoc.exists()) {
        const userData = currentUserDoc.data();
        if (userData.friends?.includes(toUserId)) {
          return 'accepted';
        }
      }

      // İki yönlü kontrol - fromUserId -> toUserId
      const forwardRequestQuery = query(
        collection(db, 'friendRequests'),
        where('from', '==', fromUserId),
        where('to', '==', toUserId)
      );
      const forwardSnapshot = await getDocs(forwardRequestQuery);

      if (!forwardSnapshot.empty) {
        const requestData = forwardSnapshot.docs[0].data();
        return requestData.status;
      }

      // İki yönlü kontrol - toUserId -> fromUserId
      const reverseRequestQuery = query(
        collection(db, 'friendRequests'),
        where('from', '==', toUserId),
        where('to', '==', fromUserId)
      );
      const reverseSnapshot = await getDocs(reverseRequestQuery);

      if (!reverseSnapshot.empty) {
        const requestData = reverseSnapshot.docs[0].data();
        return requestData.status;
      }

      return 'none';
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return 'none';
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (!selectedDate) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Seçilen tarihin başlangıç ve bitiş zamanlarını oluştur
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        const usersQuery = query(
          collection(db, 'users'),
          where('interviewDate', '>=', Timestamp.fromDate(startDate)),
          where('interviewDate', '<=', Timestamp.fromDate(endDate))
        );

        const querySnapshot = await getDocs(usersQuery);
        const fetchedUsers: User[] = [];

        querySnapshot.forEach((doc) => {
          const userData = doc.data() as User;
          // Kendi kendini gösterme
          if (doc.id !== currentUser?.uid) {
            fetchedUsers.push({
              ...userData,
              uid: doc.id
            });
          }
        });

        setUsers(fetchedUsers);

        // Arkadaşlık durumlarını kontrol et
        if (firebaseUser && fetchedUsers.length > 0) {
          const statusMap = new Map<string, 'none' | 'pending' | 'accepted' | 'rejected'>();

          // Her kullanıcı için arkadaşlık durumunu kontrol et
          for (const user of fetchedUsers) {
            const status = await checkFriendshipStatus(firebaseUser.uid, user.uid);
            statusMap.set(user.uid, status);
          }

          setFriendshipStatus(statusMap);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Kullanıcılar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedDate, currentUser, firebaseUser]);

  const handleAddFriend = async (targetUserId: string) => {
    if (!firebaseUser) {
      console.error('No firebase user');
      toast.error('Giriş yapmanız gerekiyor');
      return;
    }

    // Checking friendship status
    const status = await checkFriendshipStatus(firebaseUser.uid, targetUserId);
    console.log('Current friendship status:', status);

    if (status === 'none') {
      try {
        const requestData = {
          from: firebaseUser.uid,
          to: targetUserId,
          status: 'pending',
          read: false,
          createdAt: serverTimestamp()
        };

        console.log('Sending friend request with data:', requestData);

        const docRef = await addDoc(collection(db, 'friendRequests'), requestData);

        console.log('Friend request created with ID:', docRef.id);

        toast.success('Arkadaşlık isteği gönderildi!');

        // UI güncelleme
        setFriendshipStatus(prev => {
          const newMap = new Map(prev);
          newMap.set(targetUserId, 'pending');
          return newMap;
        });
      } catch (error: unknown) {
        console.error('Error sending friend request:', error);

        let errorMessage = 'Arkadaşlık isteği gönderilemedi.';
        if (error instanceof Error) {
          errorMessage = `Arkadaşlık isteği gönderilemedi: ${error.message}`;
          if ('code' in error && error.code === 'permission-denied') {
            errorMessage = 'İzin hatası: Firestore kurallarını kontrol edin.';
          }
        }
        toast.error(errorMessage);
      }
    } else if (status === 'pending') {
      toast('İstek zaten gönderildi', { icon: '⏳' });
    } else if (status === 'accepted') {
      toast('Zaten arkadaşsınız', { icon: '✅' });
    } else if (status === 'rejected') {
      toast.error('Arkadaşlık isteğiniz reddedildi');
    }
  };

  const handleMessage = (userId: string) => {
    if (friendshipStatus.get(userId) !== 'accepted') {
      toast.error('Önce arkadaş olmalısınız');
      return;
    }
    // Arkadaşlar sayfasına yönlendir
    router.push('/friends');
  };

  return (
    <XLayout containerClassName="max-w-7xl mx-auto min-h-screen relative">
      <div className="min-h-screen bg-[var(--background)]">
        {/* Ana container - maksimum genişlik ve merkez hizalama */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Başlık */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
              Mülakat Arkadaşları
            </h1>
            <p className="text-[var(--muted)]">
              Aynı gün mülakat olacak adaylarla tanışın ve deneyimlerinizi paylaşın
            </p>
          </div>

          {/* Tarih Seçici */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label htmlFor="date" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Mülakat Tarihiniz
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={selectedDate}
                      readOnly
                      className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] cursor-not-allowed opacity-75"
                      title="Mülakat tarihi profilinizden otomatik olarak alınır"
                    />
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Profilinizden değiştirebilirsiniz
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Kullanıcı Listesi */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
            </div>
          ) : users.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  {selectedDate ? 'Bu tarihte mülakat olacak başka aday bulunamadı' : 'Lütfen bir tarih seçin'}
                </h3>
                <p className="text-[var(--muted)]">
                  {selectedDate ? 'Farklı bir tarih seçerek diğer adayları görebilirsiniz' : 'Mülakat arkadaşlarınızı görmek için tarih seçin'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <Card key={user.uid} className="hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    {/* Kullanıcı Başlığı */}
                    <div className="flex items-center mb-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex-shrink-0">
                          {user.photoURL ? (
                            <Image
                              src={user.photoURL}
                              alt={user.displayName || 'Profil'}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {user.displayName?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--foreground)] truncate">
                            {user.displayName}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-[var(--muted)]">
                            {user.isOnline && (
                              <>
                                <Circle className="w-2 h-2 fill-current text-green-500" />
                                <span>Çevrimiçi</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kullanıcı Bilgileri */}
                    <div className="space-y-2 mb-4">
                      {user.interviewBranch && (
                        <div className="flex items-center space-x-2 text-sm text-[var(--muted)]">
                          <Users className="w-4 h-4" />
                          <span>{CANDIDATE_TYPE_LABELS[user.interviewBranch] || user.interviewBranch}</span>
                        </div>
                      )}

                      {user.interviewCity && (
                        <div className="flex items-center space-x-2 text-sm text-[var(--muted)]">
                          <MapPin className="w-4 h-4" />
                          <span>{user.interviewCity}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm text-[var(--muted)]">
                        <Calendar className="w-4 h-4" />
                        <span>Yaş: {new Date().getFullYear() - user.birthYear}</span>
                      </div>
                    </div>

                    {/* Eylem Butonları */}
                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={() => handleAddFriend(user.uid)}
                        size="sm"
                        variant={friendshipStatus.get(user.uid) === 'accepted' ? 'secondary' : 'primary'}
                        className="w-full justify-center"
                        disabled={friendshipStatus.get(user.uid) === 'accepted' || friendshipStatus.get(user.uid) === 'pending' || friendshipStatus.get(user.uid) === 'rejected'}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {friendshipStatus.get(user.uid) === 'accepted' ? 'Arkadaş' :
                          friendshipStatus.get(user.uid) === 'pending' ? 'İstek Gönderildi' :
                            friendshipStatus.get(user.uid) === 'rejected' ? 'Reddedildi' :
                              'Arkadaş Ekle'}
                      </Button>
                      {friendshipStatus.get(user.uid) === 'accepted' && (
                        <Button
                          onClick={() => handleMessage(user.uid)}
                          size="sm"
                          variant="outline"
                          className="w-full justify-center"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Mesaj Gönder
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </XLayout>
  );
}