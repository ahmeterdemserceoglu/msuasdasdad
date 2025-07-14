'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import {
  Settings,
  Grid3X3,
  Heart,
  MessageCircle,
  List,
  Award,
  FileText
} from 'lucide-react';
import XLayout from '@/app/components/layout/XLayout';
import PostCard from '@/app/components/ui/PostCard';
import { Post } from '@/app/types';
import Image from 'next/image';

interface UserStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0
  });
  const [postsLoading, setPostsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return;

      try {
        setPostsLoading(true);
        const response = await fetch(`/api/users/${user.uid}/posts`);

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

    if (user) {
      fetchUserPosts();
    }
  }, [user]);


  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (authLoading) {
    return (
      <XLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        </div>
      </XLayout>
    );
  }

  if (!user) {
    return null;
  }

  const PostGrid = ({ posts, loading }: { posts: Post[], loading: boolean }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-[var(--muted)]">
            Henüz paylaşım yok
          </p>
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => router.push(`/posts/${post.id}`)}
              className="aspect-square bg-[var(--card)] hover:opacity-80 cursor-pointer relative group"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-4 text-white">
                  <div className="flex items-center space-x-1">
                    <Heart size={20} fill="white" />
                    <span>{post.likeCount || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle size={20} fill="white" />
                    <span>{post.commentCount || 0}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 h-full flex items-center justify-center">
                <p className="text-sm text-center line-clamp-3">
                  {post.summary || post.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
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
    );
  };

  return (
    <XLayout containerClassName="w-full border-x border-[var(--border)] min-h-screen relative">
      {/* Profile Header */}
      <div className="border-b border-[var(--border)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start space-x-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || ''}
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  user.displayName?.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{user.displayName}</h1>
                  <p className="text-[var(--muted)]">@{user.uid.slice(0, 8)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => router.push('/settings/profile')}
                    className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                  >
                    Profili Düzenle
                  </button>
                  <button
                    onClick={() => router.push('/settings')}
                    className="p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                  >
                    <Settings size={20} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-8 mb-4">
                <div>
                  <span className="font-bold text-lg">{formatNumber(userStats.totalPosts)}</span>
                  <span className="text-[var(--muted)] ml-1">gönderi</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{formatNumber(userStats.totalLikes)}</span>
                  <span className="text-[var(--muted)] ml-1">beğeni</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{formatNumber(userStats.totalComments)}</span>
                  <span className="text-[var(--muted)] ml-1">yorum</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{formatNumber(userStats.totalViews)}</span>
                  <span className="text-[var(--muted)] ml-1">görüntülenme</span>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-[var(--foreground)] mb-2">{user.bio}</p>
              )}

              {/* Additional Info */}
              <div className="flex items-center space-x-4 text-sm text-[var(--muted)]">
                {user.city && (
                  <span>📍 {user.city}</span>
                )}
                <span>📅 {formatDate(user.createdAt)} tarihinde katıldı</span>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
              <Award size={16} />
              <span>Aktif Üye</span>
            </div>
            {userStats.totalPosts >= 10 && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                <FileText size={16} />
                <span>İçerik Üreticisi</span>
              </div>
            )}
            {userStats.totalLikes >= 100 && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 rounded-full text-sm">
                <Heart size={16} />
                <span>Popüler</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border)] sticky top-0 bg-[var(--background)] z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Grid3X3 size={20} className="text-[var(--primary)]" />
              <span className="font-semibold text-[var(--primary)]">Gönderiler</span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[var(--card-hover)]' : ''}`}
              >
                <Grid3X3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-[var(--card-hover)]' : ''}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <PostGrid posts={userPosts} loading={postsLoading} />
      </div>
    </XLayout>
  );
}
