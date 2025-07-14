'use client';

import { useState, useEffect } from 'react';
import XLayout from '@/app/components/layout/XLayout';
import PostCard from '@/app/components/ui/PostCard';
import { Post } from '@/app/types';
import { Loader2, PlusSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import CreatePostWidget from '@/app/components/ui/CreatePostWidget';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts?status=approved');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Gönderiler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
    // Optionally, you could re-fetch all posts to ensure perfect ordering and status
    // fetchPosts();
  };

  return (
    <XLayout>
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]">
          <div className="p-4 flex justify-between items-center">
            <h1 className="font-bold text-xl text-[var(--foreground)]">Ana Sayfa</h1>
          </div>
        </header>

        <CreatePostWidget />

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--muted)]">Henüz gönderi yok</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  content={post.content || ''}
                  userId={post.userId}
                  userName={post.userName}
                  userPhotoURL={post.userPhotoURL}
                  tags={Array.isArray(post.tags) ? post.tags : []}
                  likes={post.likeCount}
                  commentCount={post.commentCount}
                  viewCount={post.viewCount || 0}
                  createdAt={post.createdAt.toString()}
                  postType={post.postType}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </XLayout>
  );
}
