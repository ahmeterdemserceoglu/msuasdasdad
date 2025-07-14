'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, MessageCircle, Loader2 } from 'lucide-react';
import { Comment as CommentType } from '@/app/types';
import { useAuth } from '@/app/lib/auth-context';
import Comment from './Comment';
import CommentForm from './CommentForm';

interface CommentListProps {
  postId: string;
  initialCommentCount?: number;
}

interface CommentsResponse {
  comments: CommentType[];
  hasMore: boolean;
  lastCommentId?: string;
  total: number;
}

export default function CommentList({ postId, initialCommentCount = 0 }: CommentListProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastCommentId, setLastCommentId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const { firebaseUser } = useAuth();

  const fetchComments = useCallback(async (startAfter?: string) => {
    if (startAfter) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '10'
      });

      if (startAfter) {
        params.append('startAfter', startAfter);
      }

      const response = await fetch(`/api/posts/${postId}/comments?${params}`);
      
      if (!response.ok) {
        throw new Error('Yorumlar yüklenirken hata oluştu');
      }

      const data: CommentsResponse = await response.json();
      
      if (startAfter) {
        setComments(prev => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }
      
      setHasMore(data.hasMore);
      setLastCommentId(data.lastCommentId);
      setCommentCount(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [postId]);

  const loadMoreComments = () => {
    if (hasMore && lastCommentId && !isLoadingMore) {
      fetchComments(lastCommentId);
    }
  };

  const handleCommentAdded = (newComment: CommentType) => {
    setComments(prev => [newComment, ...prev]);
    setCommentCount(prev => prev + 1);
    setIsExpanded(true);
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    setCommentCount(prev => Math.max(0, prev - 1));
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && comments.length === 0) {
      fetchComments();
    }
  };

  // Bileşen yüklendiğinde yorumları otomatik olarak yükle
  useEffect(() => {
    if (isExpanded && comments.length === 0) {
      fetchComments();
    }
  }, [fetchComments, isExpanded, comments.length]);

  return (
    <div className="border-t border-[var(--border)] pt-4">
      {/* Comment Toggle Header - Hidden by default */}
      <button
        onClick={toggleExpanded}
        className="hidden flex items-center space-x-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <MessageCircle size={20} />
        <span className="text-sm font-medium">
          {commentCount === 0 ? 'Henüz yorum yok' : `${commentCount} yorum`}
        </span>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Comments Content */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Comment Form */}
          <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
              <span className="ml-2 text-sm text-[var(--muted)]">Yorumlar yükleniyor...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => fetchComments()}
                className="text-sm text-red-800 hover:underline mt-2"
              >
                Tekrar dene
              </button>
            </div>
          )}

          {/* Comments List */}
          {!isLoading && !error && (
            <div className="space-y-2">
              {comments.length === 0 ? (
                <div className="p-4 text-center text-[var(--muted)]">
                  <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz yorum yapılmamış</p>
                  <p className="text-xs">İlk yorumu siz yazın!</p>
                </div>
              ) : (
                <>
                  {comments
                    .sort((a, b) => {
                      // Kullanıcının kendi yorumları önce
                      if (firebaseUser) {
                        if (a.userId === firebaseUser.uid && b.userId !== firebaseUser.uid) return -1;
                        if (b.userId === firebaseUser.uid && a.userId !== firebaseUser.uid) return 1;
                      }
                      // Sonra tarih sırasına göre (en yeni önce)
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })
                    .map((comment) => (
                      <Comment
                        key={comment.id}
                        comment={comment}
                        postId={postId}
                        onCommentDeleted={handleCommentDeleted}
                      />
                    ))}
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={loadMoreComments}
                        disabled={isLoadingMore}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--card-hover)] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Yükleniyor...</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            <span>Daha fazla yorum yükle</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}