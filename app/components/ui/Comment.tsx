'use client';

import { Trash2, MoreHorizontal, Heart, MessageCircle, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { Comment as CommentType } from '@/app/types';
import ReplyForm from './ReplyForm';
import Image from 'next/image';

interface CommentProps {
  comment: CommentType;
  postId: string;
  onCommentDeleted?: (commentId: string) => void;
  isReply?: boolean; // To indicate if this is a reply
}

export default function Comment({ comment, postId, onCommentDeleted, isReply = false }: CommentProps) {
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
  const { firebaseUser, user } = useAuth();
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
    if (!replyCount || isReply) return; // Don't fetch replies for replies

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

  const processCommentContent = (text: string) => {
    const regex = /@([\p{L}\p{N}_\s]+?)(?=[\s.,!?]|$)/gu;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a username
        return (
          <a
            key={index}
            href={`/profile/${part}`}
            className="text-blue-500 hover:underline"
            onClick={(e) => e.stopPropagation()}>
            @{part}
          </a>
        );
      }
      return part;
    });
  };

  const canDelete = firebaseUser && (
    firebaseUser.uid === comment.userId ||
    user?.isAdmin === true
  );

  return (
    <div className="flex space-x-3">
      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
        {comment.userPhotoURL ? (
          <Image
            src={comment.userPhotoURL}
            alt={comment.userName}
            width={32}
            height={32}
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
            {comment.parentId && (
              <span className="text-xs text-[var(--muted)] bg-[var(--card-hover)] px-2 py-0.5 rounded">
                yanıt
              </span>
            )}
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
                <div className="absolute right-0 top-full mt-2 w-32 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-10">
                  <ul>
                    <li>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-500 hover:bg-[var(--card-hover)]"
                      >
                        <Trash2 size={14} className="mr-2" />
                        {isDeleting ? 'Siliniyor...' : 'Sil'}
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Text */}
        <p className="text-sm text-[var(--foreground)] mt-1 whitespace-pre-wrap">
          {processCommentContent(comment.content)}
        </p>

        {/* Comment Actions: Like, Reply */}
        <div className="flex items-center space-x-4 mt-2 text-xs text-[var(--muted)]">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-1 hover:text-[var(--primary)] transition-colors ${isLiked ? 'text-[var(--primary)]' : ''}`}
          >
            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likeCount} Beğeni</span>
          </button>

          <button onClick={() => setShowReplyForm(!showReplyForm)} className="flex items-center space-x-1 hover:text-[var(--primary)] transition-colors">
            <MessageCircle size={14} />
            <span>Yanıtla</span>
          </button>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-3">
            <ReplyForm
              postId={postId}
              parentCommentId={comment.id}
              replyingTo={comment.userName}
              onReplyAdded={(newReply) => {
                handleReplyAdded(newReply);
                setShowReplyForm(false);
              }}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Replies Section - Only show for main comments */}
        {!isReply && replyCount > 0 && (
          <div className="mt-3">
            <button onClick={handleToggleReplies} className="flex items-center space-x-1 text-xs text-[var(--primary)] font-semibold">
              <ChevronDown size={14} className={`transition-transform ${showReplies ? 'rotate-180' : ''}`} />
              <span>
                {showReplies ? 'Yanıtları gizle' : `${replyCount} yanıtı gör`}
              </span>
            </button>
          </div>
        )}

        {/* Show replies */}
        {showReplies && (
          <div className="mt-3 space-y-4 ml-8">
            {loadingReplies && <p className="text-xs text-[var(--muted)]">Yükleniyor...</p>}
            {replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                postId={postId}
                onCommentDeleted={() => handleReplyDeleted(reply.id)}
                isReply={true}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
