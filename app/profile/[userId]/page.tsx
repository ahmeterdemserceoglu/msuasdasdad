'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Edit3, MapPin, Calendar, Grid3X3, Heart, MessageCircle, Eye, MoreHorizontal } from 'lucide-react';
import XLayout from '@/app/components/layout/XLayout';
import PostCard from '@/app/components/ui/PostCard';
import { Post } from '@/app/types';
import Image from 'next/image';

interface UserData {
  uid: string;
  displayName: string;
  photoURL?: string;
  email: string;
  birthYear: number;
  city?: string;
  bio?: string;
  createdAt: string;
}

interface UserStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { user: currentUser } = useAuth();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [likedPostsLoading, setLikedPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isOwnProfile = useMemo(() => currentUser?.uid === userId, [currentUser, userId]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
          toast.error('Kullanıcı bulunamadı');
          router.push('/');
          return;
        }

        const data = await response.json();
        setUserData(data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Kullanıcı bilgileri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, router]);

  // Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setPostsLoading(true);
        const response = await fetch(`/api/users/${userId}/posts`);

        if (!response.ok) {
          console.error('Failed to fetch user posts');
          return;
        }

        const data = await response.json();
        const posts: Post[] = data.posts || [];
        setUserPosts(posts);

        // Calculate stats
        const totalLikes = posts.reduce((sum, post) => sum + (post.likeCount || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.commentCount || 0), 0);
        const totalViews = posts.reduce((sum, post) => sum + (post.viewCount || 0), 0);

        setUserStats({
          totalPosts: posts.length,
          totalLikes,
          totalComments,
          totalViews
        });
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setPostsLoading(false);
      }
    };

    if (userId) {
      fetchUserPosts();
    }
  }, [userId]);

  // Fetch liked posts when tab changes
  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (activeTab !== 'liked' || !isOwnProfile) return;
      
      try {
        setLikedPostsLoading(true);
        const response = await fetch(`/api/users/${userId}/liked-posts`);

        if (!response.ok) {
          console.error('Failed to fetch liked posts');
          return;
        }

        const data = await response.json();
        setLikedPosts(data.posts || []);
      } catch (error) {
        console.error('Error fetching liked posts:', error);
      } finally {
        setLikedPostsLoading(false);
      }
    };

    fetchLikedPosts();
  }, [activeTab, userId, isOwnProfile]);

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <XLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        </div>
      </XLayout>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <XLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[var(--card-hover)] rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-[var(--foreground)]" />
            </button>
            <div>
              <h1 className="font-bold text-lg text-[var(--foreground)]">{userData.displayName}</h1>
              <p className="text-sm text-[var(--muted)]">{userStats.totalPosts} paylaşım</p>
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => router.push('/settings/profile')}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm"
            >
              <Edit3 size={16} />
              <span>Profili Düzenle</span>
            </button>
          )}
        </div>
      </header>

      {/* Profile Info */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-start space-x-4 mb-4">
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {userData.photoURL ? (
              <Image
                src={userData.photoURL}
                alt={userData.displayName}
                className="w-20 h-20 rounded-full object-cover"
                width={80}
                height={80}
              />
            ) : (
              userData.displayName.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{userData.displayName}</h2>
            <p className="text-[var(--muted)] text-sm mb-2">@{userData.uid.slice(0, 8)}</p>
            {userData.bio && (
              <p className="text-[var(--foreground)] mb-3">{userData.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
              {userData.city && (
                <div className="flex items-center space-x-1">
                  <MapPin size={14} />
                  <span>{userData.city}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>{formatJoinDate(userData.createdAt)} tarihinde katıldı</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-[var(--card-hover)] rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{userStats.totalPosts}</div>
            <div className="text-sm text-[var(--muted)]">Paylaşım</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{userStats.totalLikes}</div>
            <div className="text-sm text-[var(--muted)]">Beğeni</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{userStats.totalComments}</div>
            <div className="text-sm text-[var(--muted)]">Yorum</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 text-center font-semibold p-3 transition-colors ${activeTab === 'posts'
            ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
            : 'text-[var(--muted)] hover:bg-[var(--card-hover)]'
            }`}
        >
          Paylaşımlar
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex-1 text-center font-semibold p-3 transition-colors ${activeTab === 'about'
            ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
            : 'text-[var(--muted)] hover:bg-[var(--card-hover)]'
            }`}
        >
          Hakkında
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'posts' ? (
          <div>
            {postsLoading ? (
              <div className="py-8 px-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
                <p className="text-[var(--muted)] mt-4">Yükleniyor...</p>
              </div>
            ) : userPosts.length > 0 ? (
              <div className="space-y-4 p-4">
                {userPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    content={post.summary || post.content || ''}
                    userId={post.userId}
                    userName={post.userName}
                    userPhotoURL={post.userPhotoURL}
                    tags={(post.tags as unknown as Record<string, string>) || {}}
                    likes={post.likeCount}
                    commentCount={post.commentCount}
                    viewCount={post.viewCount || 0}
                    createdAt={new Date(post.createdAt).toString()}
                    postType={post.interviewType}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 text-center">
                <p className="text-[var(--muted)]">
                  {isOwnProfile ? 'Henüz paylaşım yapmadınız.' : 'Bu kullanıcının henüz paylaşımı yok.'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="card">
              <h3 className="font-bold text-lg mb-4">Kullanıcı Hakkında</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--muted)] mb-1">İsim</p>
                  <p className="font-medium">{userData.displayName}</p>
                </div>

                {userData.city && (
                  <div>
                    <p className="text-sm text-[var(--muted)] mb-1">Şehir</p>
                    <p className="font-medium">{userData.city}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-[var(--muted)] mb-1">Doğum Yılı</p>
                  <p className="font-medium">{userData.birthYear}</p>
                </div>

                <div>
                  <p className="text-sm text-[var(--muted)] mb-1">Katılım Tarihi</p>
                  <p className="font-medium">{formatJoinDate(userData.createdAt)}</p>
                </div>

                {userData.bio && (
                  <div>
                    <p className="text-sm text-[var(--muted)] mb-1">Biyografi</p>
                    <p className="font-medium">{userData.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </XLayout>
  );
}
