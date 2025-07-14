'use client';

import { Send } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { Comment } from '@/app/types';
import Image from 'next/image';

interface CommentFormProps {
  postId: string;
  onCommentAdded?: (comment: Comment) => void;
}

export default function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { firebaseUser, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firebaseUser) {
      toast.error('Yorum yapmak için giriş yapmalısınız');
      return;
    }

    if (!content.trim()) {
      toast.error('Yorum içeriği boş olamaz');
      return;
    }

    if (content.length > 1000) {
      toast.error('Yorum 1000 karakterden uzun olamaz');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: content.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Yorum eklenirken hata oluştu');
      }

      const result = await response.json();

      if (result.success && result.comment) {
        toast.success('Yorum başarıyla eklendi');
        setContent('');
        onCommentAdded?.(result.comment);
      } else {
        throw new Error('Yorum eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Yorum eklenirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="p-4 bg-[var(--card-hover)] rounded-lg">
        <p className="text-sm text-[var(--muted)] text-center">
          Yorum yapmak için giriş yapmalısınız
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-[var(--card-hover)] rounded-lg">
      <div className="flex space-x-3">
        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || ''}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="font-semibold text-sm">
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Yorumunuzu yazın..."
            className="w-full p-3 border border-[var(--border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
            rows={3}
            maxLength={1000}
            disabled={isSubmitting}
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-[var(--muted)]">
              {content.length}/1000 karakter
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Gönderiliyor...' : 'Gönder'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
