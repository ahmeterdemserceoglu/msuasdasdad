'use client';

import { Heart, MessageCircle, Share, MoreHorizontal, Edit3, Trash2, Flag, Eye, Hash } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import CommentList from './CommentList';
import Image from 'next/image';

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  imageUrl?: string;
  tags: string[];
  postType?: 'deneyim' | 'soru' | 'bilgi';
  likes: number;
  commentCount?: number;
  viewCount?: number;
  createdAt: string;
}

export default function PostCard({
  id,
  title,
  content,
  userId,
  userName,
  userPhotoURL,
  imageUrl,
  tags,
  postType = 'deneyim',
  likes,
  commentCount = 0,
  viewCount = 0,
  createdAt,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Number(likes) || 0);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const { firebaseUser, userRole } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!firebaseUser) return;
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/posts/${id}/like`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.liked);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    checkLikeStatus();
  }, [id, firebaseUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLike = async () => {
    if (!firebaseUser) {
      toast.error('Beğenmek için giriş yapmalısınız');
      return;
    }
    const previousLiked = isLiked;
    const previousCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({})
      });
      if (!response.ok) throw new Error('Like işlemi başarısız');
      const data = await response.json();
      setIsLiked(data.liked);
      setLikeCount(data.likes);
    } catch (error) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error('Beğeni işlemi başarısız oldu');
    }
  };

  const handleEdit = () => {
    router.push(`/posts/${id}/edit`);
    setShowDropdown(false);
  };

  const handleDelete = async () => {
    if (!firebaseUser || !window.confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) return;
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Silme işlemi başarısız');
      toast.success('Gönderi başarıyla silindi');
      window.location.reload();
    } catch (error) {
      toast.error('Gönderi silinirken bir hata oluştu');
    }
    setShowDropdown(false);
  };

  const handleReport = async () => {
    if (!firebaseUser) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }
    if (hasReported) {
      toast('Bu gönderiyi zaten raporladınız');
      setShowDropdown(false);
      return;
    }
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/posts/${id}/report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'inappropriate' })
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400 && data.error.includes('zaten raporladınız')) {
          setHasReported(true);
          toast.error(data.error);
        } else {
          throw new Error(data.error || 'Raporlama işlemi başarısız');
        }
      } else {
        toast.success('Gönderi başarıyla raporlandı');
        setHasReported(true);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Gönderi raporlanırken bir hata oluştu');
    }
    setShowDropdown(false);
  };

  const canEditDelete = userRole === 'admin' || firebaseUser?.uid === userId;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const truncatedContent = content && content.length > 200 ? content.substring(0, 200) + '...' : content || '';

  const navigateToPost = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, .dropdown')) return;
    router.push(`/posts/${id}`);
  };

  return (
    <div
      className="p-6 bg-[var(--card)] rounded-xl border border-[var(--border)] cursor-pointer"
      onClick={navigateToPost}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
            {userPhotoURL ? (
              <Image src={userPhotoURL} alt={userName} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold">{userName?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">{userName}</h3>
            <p className="text-sm text-[var(--muted)]">{formatDate(createdAt)}</p>
          </div>
        </div>
        <div className="relative dropdown" ref={dropdownRef}>
          <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 hover:bg-[var(--card-hover)] rounded-full transition-colors">
            <MoreHorizontal size={20} className="text-[var(--muted)]" />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-10 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-2 z-10 min-w-[180px]">
              {canEditDelete ? (
                <>
                  <button onClick={handleEdit} className="flex items-center space-x-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--card-hover)] w-full text-left"><Edit3 size={16} /><span>Düzenle</span></button>
                  <button onClick={handleDelete} className="flex items-center space-x-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 w-full text-left"><Trash2 size={16} /><span>Sil</span></button>
                  <div className="border-t border-[var(--border)] my-1"></div>
                </>
              ) : null}
              <button onClick={handleReport} disabled={hasReported} className="flex items-center space-x-2 px-4 py-2 text-sm w-full text-left text-[var(--foreground)] hover:bg-[var(--card-hover)] disabled:text-[var(--muted)] disabled:cursor-not-allowed">
                <Flag size={16} /><span>{hasReported ? 'Raporlandı' : 'Raporla'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">{title}</h2>
        <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
          {showFullContent ? content : truncatedContent}
        </p>
        {content && content.length > 200 && (
          <button onClick={(e) => { e.stopPropagation(); setShowFullContent(!showFullContent); }} className="text-[var(--primary)] hover:underline text-sm mt-2">
            {showFullContent ? 'Daha az göster' : 'Devamını oku'}
          </button>
        )}
        {imageUrl && (
          <div className="mt-4 rounded-lg overflow-hidden border border-[var(--border)]">
            <Image src={imageUrl} alt="Post image" width={500} height={300} className="object-cover w-full h-auto" />
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                <Hash size={12} className="mr-1" /> {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
        <div className="flex items-center space-x-4">
          <button onClick={handleLike} className={`flex items-center space-x-2 p-2 rounded-full transition-colors ${isLiked ? 'text-red-500' : 'text-[var(--muted)] hover:text-red-500'}`}>
            <Heart size={20} className={isLiked ? 'fill-current' : ''} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-[var(--card-hover)] text-[var(--muted)] transition-colors">
            <MessageCircle size={20} className={showComments ? 'text-[var(--primary)]' : ''} />
            <span className="text-sm font-medium">{!commentCount || commentCount === 0 ? 'Yorum' : `${commentCount} Yorum`}</span>
          </button>
          <div className="flex items-center space-x-2 px-3 py-2 text-[var(--muted)]">
            <Eye size={20} />
            <span className="text-sm font-medium">{viewCount ?? 0}</span>
          </div>
        </div>
        <button className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-[var(--card-hover)] text-[var(--muted)] transition-colors">
          <Share size={20} />
          <span className="text-sm font-medium">Paylaş</span>
        </button>
      </div>

      {showComments && (
        <div className="comment-section pt-4" onClick={(e) => e.stopPropagation()}>
          <CommentList postId={id} />
        </div>
      )}
    </div>
  );
}
