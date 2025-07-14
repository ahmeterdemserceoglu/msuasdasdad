'use client';

import { Send, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { Comment } from '@/app/types';
import Image from 'next/image';

interface ReplyFormProps {
  postId: string;
  parentCommentId: string;
  onReplyAdded?: (reply: Comment) => void;
  onCancel?: () => void;
  replyingTo?: string; // Name of person being replied to
}

export default function ReplyForm({
  postId,
  parentCommentId,
  onReplyAdded,
  onCancel,
  replyingTo
}: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { firebaseUser, user } = useAuth();

  useEffect(() => {
    if (replyingTo && user?.displayName !== replyingTo) {
      setContent(`@${replyingTo} `);
    }
  }, [replyingTo, user?.displayName]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firebaseUser) {
      toast.error('Yanıtlamak için giriş yapmalısınız');
      return;
    }

    if (!content.trim()) {
      toast.error('Yanıt içeriği boş olamaz');
      return;
    }

    if (content.length > 500) {
      toast.error('Yanıt 500 karakterden uzun olamaz');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/posts/${postId}/comments/${parentCommentId}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: content.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Yanıt eklenirken hata oluştu');
      }

      const result = await response.json();

      if (result.success && result.reply) {
        toast.success('Yanıt başarıyla eklendi');
        setContent('');
        onReplyAdded?.(result.reply);
        onCancel?.();
      } else {
        throw new Error('Yanıt eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Yanıt eklenirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="p-3 bg-[var(--card-hover)] rounded-lg">
        <p className="text-sm text-[var(--muted)] text-center">
          Yanıtlamak için giriş yapmalısınız
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-[var(--card-hover)] rounded-lg border-l-2 border-[var(--primary)]">
      <div className="flex items-start space-x-3">
        {/* User Avatar */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || ''}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <span className="font-semibold text-xs">
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Yanıtınızı yazın..."
            className="w-full p-2 border border-[var(--border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)] text-sm"
            rows={2}
            maxLength={500}
            disabled={isSubmitting}
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-[var(--muted)]">
              {content.length}/500 karakter
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={12} />
                <span>İptal</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="flex items-center space-x-1 px-3 py-1 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                <Send size={12} />
                <span>{isSubmitting ? 'Gönderiliyor...' : 'Yanıtla'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
