'use client';

import { Heart, MessageCircle, Share, MoreHorizontal, Edit3, Trash2, Flag, Eye, Hash, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import CommentList from './CommentList';

interface PostCardProps {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  tags: Record<string, string>; // Changed to accept object format
  postType?: string;
  likes: number;
  commentCount?: number;
  viewCount?: number;
  createdAt: string;
  experienceDate?: string;
}





const POST_TYPE_LABELS: Record<string, string> = {
  'deneyim': 'Deneyim Paylaşımı',
  'soru': 'Soru-Cevap',
  'bilgilendirme': 'Bilgilendirme'
};

export default function PostCard({
  id,
  title,
  content,
  summary,
  userId,
  userName,
  userPhotoURL,
  interviewType,
  candidateType,
  city,
  tags,
  postType = 'deneyim',
  likes,
  commentCount = 0,
  viewCount = 0,
  createdAt,
  experienceDate
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const { firebaseUser, userRole } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Like durumunu API'den çek
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!firebaseUser) return;
      
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/posts/${id}/like`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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

  // Dropdown dışında tıklama ile kapatma
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

    if (isLoading) return;

    setIsLoading(true);
    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/posts/${id}/like`, {
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
      // Hata durumunda geri al
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error('Beğeni işlemi başarısız oldu');
      console.error('Error liking post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/posts/${id}/edit`);
    setShowDropdown(false);
  };

  const handleDelete = async () => {
    if (!firebaseUser) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }

    if (!window.confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız');
      }

      toast.success('Gönderi başarıyla silindi');
      // Sayfayı yenile veya parent component'e bildir
      window.location.reload();
    } catch (error) {
      toast.error('Gönderi silinirken bir hata oluştu');
      console.error('Error deleting post:', error);
    }
    setShowDropdown(false);
  };

  const handleReport = async () => {
    if (!firebaseUser) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }

    if (hasReported) {
      toast.info('Bu gönderiyi zaten raporladınız');
      setShowDropdown(false);
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/posts/${id}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'inappropriate' // Default reason
        })
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 400 && data.error === 'Bu gönderiyi zaten raporladınız.') {
          setHasReported(true);
          toast.info('Bu gönderiyi zaten raporladınız');
        } else {
          throw new Error(data.error || 'Raporlama işlemi başarısız');
        }
      } else {
        toast.success('Gönderi başarıyla raporlandı');
        setHasReported(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gönderi raporlanırken bir hata oluştu');
      console.error('Error reporting post:', error);
    }
    setShowDropdown(false);
  };

  // Kullanıcının bu gönderiyi düzenleyip silebilir mi kontrolü
  const canEditDelete = userRole === 'admin' || firebaseUser?.uid === userId;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatExperienceDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const truncatedContent = content.length > 200 ? content.substring(0, 200) + '...' : content;

  return (
    <div 
      className="card hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500 cursor-pointer"
      onClick={(e) => {
        // Dropdown, buttons, forms, inputs gibi interactive elementlere tıklanınca post detayına gitmesin
        const target = e.target as HTMLElement;
        const isInteractive = 
          target.closest('button') || 
          target.closest('[role="button"]') || 
          target.closest('.dropdown') ||
          target.closest('form') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('.comment-section') || // Yorum bölümü
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'BUTTON';
          
        if (!isInteractive) {
          router.push(`/posts/${id}`);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
            {userPhotoURL ? (
              <img 
                src={userPhotoURL} 
                alt={userName} 
                className="w-12 h-12 rounded-full object-cover" 
              />
            ) : (
              <span className="font-semibold text-lg">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">{userName}</h3>
            <p className="text-sm text-[var(--muted)]">{formatDate(createdAt)}</p>
          </div>
        </div>
        <div className="relative dropdown" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-[var(--card-hover)] rounded-full transition-colors"
          >
            <MoreHorizontal size={20} className="text-[var(--muted)]" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-10 min-w-[180px]">
              {canEditDelete && (
                <>
                  <button
                    onClick={handleEdit}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    <Edit3 size={16} />
                    <span>Düzenle</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                  >
                    <Trash2 size={16} />
                    <span>Sil</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                </>
              )}
              <button
                onClick={handleReport}
                className={`flex items-center space-x-2 px-4 py-2 text-sm w-full text-left ${
                  hasReported 
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                disabled={hasReported}
              >
                <Flag size={16} className={hasReported ? 'text-gray-400' : ''} />
                <span>{hasReported ? 'Zaten raporladınız' : 'Raporla'}</span>
              </button>
            </div>
          )}
        </div>
      </div>


      {/* İçerik */}
      <div className="mb-4">
        <p className="text-[var(--foreground)] leading-relaxed">
          {showFullContent ? content : truncatedContent}
        </p>
        {content.length > 200 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-[var(--primary)] hover:underline text-sm mt-2"
          >
            {showFullContent ? 'Daha az göster' : 'Devamını oku'}
          </button>
        )}
      </div>

      {/* Post Type Badge */}
      {postType && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            postType === 'deneyim' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              : postType === 'soru'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {postType === 'deneyim' && <MessageCircle size={12} className="mr-1" />}
            {postType === 'soru' && <Hash size={12} className="mr-1" />}
            {postType === 'bilgilendirme' && <Sparkles size={12} className="mr-1" />}
            {POST_TYPE_LABELS[postType as keyof typeof POST_TYPE_LABELS]}
          </span>
        </div>
      )}

      {/* Meta bilgiler - Tags as key-value pairs */}
      {tags && Object.keys(tags).length > 0 && (
        <div className="space-y-2 mb-4 p-3 bg-[var(--card-hover)] rounded-lg">
          <div className="space-y-2">
            {Object.entries(tags).map(([question, answer], index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <span className="font-medium text-[var(--foreground)] min-w-fit">{question}:</span>
                <span className="text-[var(--muted)]">{answer}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors ${
              isLiked 
                ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                : 'hover:bg-[var(--card-hover)] text-[var(--muted)]'
            }`}
          >
            <Heart 
              size={20} 
              className={isLiked ? 'fill-current' : ''} 
            />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-[var(--card-hover)] text-[var(--muted)] transition-colors"
          >
            <MessageCircle size={20} className={showComments ? 'text-[var(--primary)]' : ''} />
            <span className="text-sm font-medium">
              {commentCount === 0 ? 'Yorum' : `${commentCount} Yorum`}
            </span>
          </button>
          
          <div className="flex items-center space-x-2 px-3 py-2 text-[var(--muted)]">
            <Eye size={20} />
            <span className="text-sm font-medium">{viewCount}</span>
          </div>
        </div>

        <button className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-[var(--card-hover)] text-[var(--muted)] transition-colors">
          <Share size={20} />
          <span className="text-sm font-medium">Paylaş</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comment-section" onClick={(e) => e.stopPropagation()}>
          <CommentList postId={id} initialCommentCount={commentCount} />
        </div>
      )}
    </div>
  );
}
