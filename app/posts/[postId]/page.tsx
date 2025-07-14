'use client';

import { useParams } from 'next/navigation';
import PostDetail from '@/app/components/ui/PostDetail';
import { Suspense } from 'react';

// Loading component for the post detail
function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[var(--card-hover)] rounded-full animate-pulse"></div>
              <div>
                <div className="h-4 w-16 bg-[var(--card-hover)] rounded animate-pulse mb-1"></div>
                <div className="h-3 w-24 bg-[var(--card-hover)] rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-6 w-16 bg-[var(--card-hover)] rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-[var(--card-hover)] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post Content Skeleton */}
          <div className="lg:col-span-2">
            <div className="card">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-[var(--card-hover)] rounded-full animate-pulse"></div>
                <div>
                  <div className="h-4 w-32 bg-[var(--card-hover)] rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-40 bg-[var(--card-hover)] rounded animate-pulse"></div>
                </div>
              </div>

              {/* Title */}
              <div className="h-8 w-3/4 bg-[var(--card-hover)] rounded animate-pulse mb-4"></div>

              {/* Content */}
              <div className="space-y-3 mb-6">
                <div className="h-4 w-full bg-[var(--card-hover)] rounded animate-pulse"></div>
                <div className="h-4 w-full bg-[var(--card-hover)] rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-[var(--card-hover)] rounded animate-pulse"></div>
                <div className="h-4 w-full bg-[var(--card-hover)] rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-[var(--card-hover)] rounded animate-pulse"></div>
              </div>

              {/* Meta */}
              <div className="p-4 bg-[var(--card-hover)] rounded-lg mb-6">
                <div className="flex flex-wrap gap-4">
                  <div className="h-4 w-24 bg-[var(--background)] rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-[var(--background)] rounded animate-pulse"></div>
                  <div className="h-4 w-28 bg-[var(--background)] rounded animate-pulse"></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <div className="flex items-center space-x-6">
                  <div className="h-8 w-16 bg-[var(--card-hover)] rounded-full animate-pulse"></div>
                  <div className="h-8 w-16 bg-[var(--card-hover)] rounded-full animate-pulse"></div>
                </div>
                <div className="h-8 w-20 bg-[var(--card-hover)] rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Author Info */}
              <div className="card">
                <div className="h-5 w-32 bg-[var(--card-hover)] rounded animate-pulse mb-4"></div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-[var(--card-hover)] rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-4 w-24 bg-[var(--card-hover)] rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-16 bg-[var(--card-hover)] rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-full bg-[var(--card-hover)] rounded animate-pulse"></div>
                  <div className="h-3 w-3/4 bg-[var(--card-hover)] rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-full bg-[var(--card-hover)] rounded animate-pulse"></div>
              </div>

              {/* Stats */}
              <div className="card">
                <div className="h-5 w-24 bg-[var(--card-hover)] rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-20 bg-[var(--card-hover)] rounded animate-pulse"></div>
                      <div className="h-4 w-8 bg-[var(--card-hover)] rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PostPage() {
  const params = useParams();
  const postId = params.postId as string;

  if (!postId) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Geçersiz Post ID</h2>
          <p className="text-[var(--muted)]">Post ID'si bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetail postId={postId} />
    </Suspense>
  );
}
