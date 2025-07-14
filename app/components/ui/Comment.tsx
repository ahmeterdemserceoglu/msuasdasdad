'use client';

import { Trash2, MoreHorizontal, Heart, MessageCircle, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { Comment as CommentType } from '@/app/types';
import ReplyForm from './ReplyForm';

interface CommentProps {
  comment: CommentType;
  postId: string;
  onCommentDeleted?: (commentId: string) => void;
  level?: number; // For nested display (0 = main comment, 1 = reply)
}

export default function Comment({ comment, postId, onCommentDeleted, level = 0 }: CommentProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<CommentType[]>([]);
  const [replyCount, setReplyCount] = useState(comment.replyCount || 0);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const { firebaseUser, userData } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get initial like count and check if user liked
  useEffect(() => {
    // Set initial like count from comment data
    setLikeCount(comment.likeCount || 0);

    // Check if current user liked this comment
    const checkLikeStatus = async () => {
      if (!firebaseUser) return;
      
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/posts/${postId}/comments/${comment.id}/like`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.liked);
        }
      } catch (error) {
        console.error('Error checking comment like status:', error);
      }
    };

    checkLikeStatus();
  }, [comment.id, comment.likeCount, postId, firebaseUser]);

  const fetchReplies = async () => {
    if (level > 0 || !replyCount) return; // Only main comments can have replies
    
    setLoadingReplies(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${comment.id}/replies`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies || []);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleToggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  const handleReplyAdded = (newReply: CommentType) => {
    setReplies(prev => [...prev, newReply]);
    setReplyCount(prev => prev + 1);
    setShowReplies(true);
  };

  const handleReplyDeleted = (replyId: string) => {
    setReplies(prev => prev.filter(reply => reply.id !== replyId));
    setReplyCount(prev => Math.max(0, prev - 1));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = async () => {
    if (!firebaseUser) {
      toast.error('Beğenmek için giriş yapmalısınız');
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/posts/${postId}/comments/${comment.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('Like işlemi başarısız');
      }

      const data = await response.json();
      setIsLiked(data.liked);
      setLikeCount(data.likes);
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error('Beğeni işlemi başarısız oldu');
      console.error('Error liking comment:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!firebaseUser) {
      toast.error('Yorum silmek için giriş yapmalısınız');
      return;
    }

    if (isDeleting) return;

    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentId: comment.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Yorum silinirken hata oluştu');
      }

      toast.success('Yorum başarıyla silindi');
      onCommentDeleted?.(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Yorum silinirken hata oluştu');
    } finally {
      setIsDeleting(false);
      setShowActions(false);
    }
  };

  // Kullanıcı kendi yorumunu veya admin tüm yorumları silebilir
  const canDelete = firebaseUser && (
    firebaseUser.uid === comment.userId || 
    userData?.isAdmin === true
  );

  return (
    <div className="flex space-x-3 p-3 hover:bg-[var(--card-hover)] rounded-lg transition-colors">
      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
        {comment.userPhotoURL ? (
          <img 
            src={comment.userPhotoURL} 
            alt={comment.userName} 
            className="w-8 h-8 rounded-full object-cover" 
          />
        ) : (
          <span className="font-semibold text-sm">
            {comment.userName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-sm text-[var(--foreground)]">
              {comment.userName}
            </h4>
            <span className="text-xs text-[var(--muted)]">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          {/* Actions */}
          {canDelete && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 hover:bg-[var(--card-hover)] rounded-full transition-colors"
              >
                <MoreHorizontal size={16} className="text-[var(--muted)]" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-8 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span>{isDeleting ? 'Siliniyor...' : 'Sil'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Text */}
        <p className="text-sm text-[var(--foreground)] mt-1 leading-relaxed">
          {comment.content}
        </p>

        {/* Comment Actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                isLiked 
                  ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                  : 'hover:bg-[var(--card-hover)] text-[var(--muted)]'
              }`}
            >
              <Heart 
                size={14} 
                className={isLiked ? 'fill-current' : ''} 
              />
              {likeCount > 0 && (
                <span className="font-medium">{likeCount}</span>
              )}
            </button>

            {/* Reply button - only for main comments */}
            {level === 0 && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs hover:bg-[var(--card-hover)] text-[var(--muted)] transition-colors"
              >
                <MessageCircle size={14} />
                <span>Yanıtla</span>
              </button>
            )}

            {/* Show replies button */}
            {level === 0 && replyCount > 0 && (
              <button
                onClick={handleToggleReplies}
                className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs hover:bg-[var(--card-hover)] text-[var(--primary)] transition-colors"
              >
                <ChevronDown 
                  size={14} 
                  className={`transition-transform ${showReplies ? 'rotate-180' : ''}`}
                />
                <span>{replyCount} yanıt</span>
              </button>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && level === 0 && (
          <div className="mt-3">
            <ReplyForm
              postId={postId}
              parentCommentId={comment.id}
              replyingTo={comment.userName}
              onReplyAdded={handleReplyAdded}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Replies */}
        {level === 0 && showReplies && (
          <div className="mt-3 space-y-2">
            {loadingReplies ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]"></div>
                <span className="ml-2 text-xs text-[var(--muted)]">Yanıtlar yükleniyor...</span>
              </div>
            ) : (
              replies.map((reply) => (
                <div key={reply.id} className="ml-4 pl-3 border-l-2 border-[var(--border)]">
                  <Comment
                    comment={reply}
                    postId={postId}
                    onCommentDeleted={handleReplyDeleted}
                    level={1}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
