'use client';

import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  Tag, 
  Clock,
  User,
  ArrowLeft,
  Bookmark,
  Flag,
  Copy,
  ExternalLink,
  Eye,
  Edit3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import CommentList from './CommentList';


interface PostDetailProps {
  postId: string;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  summary?: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  interviewType: string;
  candidateType: string;
  city?: string;
  tags: string[];
  likes: number;
  commentCount: number;
  createdAt: string;
  experienceDate: string;
  status: string;
}

const INTERVIEW_TYPE_LABELS = {
  'sozlu': 'Sözlü Mülakat',
  'spor': 'Spor Testi',
  'evrak': 'Evrak İncelemesi',
  'psikolojik': 'Psikolojik Test',
  'diger': 'Diğer',
  'genel': 'Genel'
};

const CANDIDATE_TYPE_LABELS = {
  'subay': 'Subay',
  'astsubay': 'Astsubay',
  'harbiye': 'Harbiye',
  'sahil-guvenlik': 'Sahil Güvenlik',
  'jandarma': 'Jandarma',
  'diger': 'Diğer'
};

export default function PostDetail({ postId }: PostDetailProps) {
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  const [isLiking, setIsLiking] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [canEdit, setCanEdit] = useState(false);
  
  const { firebaseUser, userData } = useAuth();
  const router = useRouter();

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${postId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Post bulunamadı');
          } else {
            setError('Post yüklenirken hata oluştu');
          }
          return;
        }

        const data = await response.json();
        setPost(data.post);
        setLikeCount(data.post.likes || 0);
        
        // Track view
        const viewResponse = await fetch(`/api/posts/${postId}/views`, {
          method: 'POST'
        });
        
        if (viewResponse.ok) {
          const viewData = await viewResponse.json();
          setViewCount(viewData.views);
        } else {
          // Fallback to existing view count if available
          setViewCount(data.post.viewCount || 0);
        }
      } catch (err: Error) {
        setError('Post yüklenirken hata oluştu');
        console.error('Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Check like status
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!firebaseUser || !post) return;
      
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/posts/${postId}/like`, {
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
  }, [postId, firebaseUser, post]);

  // Check edit permission
  useEffect(() => {
    if (!post || !firebaseUser) {
      setCanEdit(false);
      return;
    }

    // Check if user is the owner or admin
    const isOwner = post.userId === firebaseUser.uid;
    const isAdmin = userData?.isAdmin === true;
    setCanEdit(isOwner || isAdmin);
  }, [post, firebaseUser, userData]);

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
      const response = await fetch(`/api/posts/${postId}/like`, {
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
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (type: 'copy' | 'external') => {
    const url = `${window.location.origin}/posts/${postId}`;
    
    if (type === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link kopyalandı');
      } catch (error) {
        toast.error('Link kopyalanamadı');
      }
    } else {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post?.title || '')}`, '_blank');
    }
    
    setShowShareMenu(false);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-[var(--muted)]">Post yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 rounded-full p-3 inline-block mb-4">
            <Flag className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Post Bulunamadı</h2>
          <p className="text-[var(--muted)] mb-6">
            {error || 'Aradığınız post bulunamadı veya silinmiş olabilir.'}
          </p>
          <button 
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-[var(--card-hover)] rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-[var(--foreground)]" />
              </button>
              <div>
                <h1 className="font-bold text-lg text-[var(--foreground)]">Post</h1>
                <p className="text-sm text-[var(--muted)]">{post.userName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-[var(--muted)]">
                <Eye size={16} />
                <span className="text-sm">{viewCount}</span>
              </div>
              
              {canEdit && (
                <button
                  onClick={() => router.push(`/posts/${postId}/edit`)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm"
                >
                  <Edit3 size={16} />
                  <span>Düzenle</span>
                </button>
              )}
              
              <div className="relative">
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 hover:bg-[var(--card-hover)] rounded-full transition-colors"
                >
                  <MoreHorizontal size={20} className="text-[var(--muted)]" />
                </button>
                
                {showMoreMenu && (
                  <div className="absolute right-0 top-12 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-10 py-2 min-w-[160px]">
                    {canEdit && (
                      <button 
                        onClick={() => router.push(`/posts/${postId}/edit`)}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition-colors"
                      >
                        <Edit3 size={16} />
                        <span>Düzenle</span>
                      </button>
                    )}
                    <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition-colors">
                      <Bookmark size={16} />
                      <span>Kaydet</span>
                    </button>
                    <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition-colors">
                      <Flag size={16} />
                      <span>Şikâyet Et</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post Content */}
          <div className="lg:col-span-2">
            <article className="card">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                    {post.userPhotoURL ? (
                      <img 
                        src={post.userPhotoURL} 
                        alt={post.userName} 
                        className="w-12 h-12 rounded-full object-cover" 
                      />
                    ) : (
                      <span className="font-semibold text-lg">
                        {post.userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] flex items-center space-x-2">
                      <span>{post.userName}</span>
                      {post.status === 'approved' && (
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-[var(--muted)]">
                      <Clock size={14} />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Title */}
              <h1 className="text-3xl font-bold mb-4 text-[var(--foreground)] leading-tight">
                {post.title}
              </h1>

              {/* Post Summary */}
              {post.summary && (
                <div className="mb-6 p-4 bg-[var(--card-hover)] rounded-lg border-l-4 border-[var(--primary)]">
                  <p className="text-[var(--muted)] italic">{post.summary}</p>
                </div>
              )}

              {/* Post Content */}
              <div className="mb-6">
                <div className="prose prose-lg max-w-none">
                  <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>
              </div>

              {/* Post Meta */}
              <div className="space-y-4 mb-6 p-4 bg-[var(--card-hover)] rounded-lg">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-[var(--muted)]">
                    <Tag size={16} />
                    <span>{INTERVIEW_TYPE_LABELS[post.interviewType as keyof typeof INTERVIEW_TYPE_LABELS]}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[var(--muted)]">
                    <User size={16} />
                    <span>{CANDIDATE_TYPE_LABELS[post.candidateType as keyof typeof CANDIDATE_TYPE_LABELS]}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[var(--muted)]">
                    <Calendar size={16} />
                    <span>Deneyim: {formatExperienceDate(post.experienceDate)}</span>
                  </div>
                  {post.city && (
                    <div className="flex items-center space-x-2 text-[var(--muted)]">
                      <MapPin size={16} />
                      <span>{post.city}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[var(--primary-light)] text-[var(--primary)] text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                      isLiked 
                        ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                        : 'hover:bg-[var(--card-hover)] text-[var(--muted)]'
                    }`}
                  >
                    <Heart 
                      size={20} 
                      className={isLiked ? 'fill-current' : ''} 
                    />
                    <span className="font-medium">{likeCount}</span>
                  </button>
                  
                  <div className="flex items-center space-x-2 px-4 py-2 text-[var(--muted)]">
                    <MessageCircle size={20} />
                    <span className="font-medium">{post.commentCount}</span>
                  </div>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-[var(--card-hover)] text-[var(--muted)] transition-colors"
                  >
                    <Share size={20} />
                    <span className="font-medium">Paylaş</span>
                  </button>
                  
                  {showShareMenu && (
                    <div className="absolute right-0 top-12 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-10 py-2 min-w-[160px]">
                      <button 
                        onClick={() => handleShare('copy')}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition-colors"
                      >
                        <Copy size={16} />
                        <span>Linki Kopyala</span>
                      </button>
                      <button 
                        onClick={() => handleShare('external')}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition-colors"
                      >
                        <ExternalLink size={16} />
                        <span>Twitter'da Paylaş</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>

            {/* Comments Section */}
            <div className="mt-6 card">
              <h3 className="text-xl font-bold mb-4">Yorumlar ({post.commentCount})</h3>
              <CommentList postId={postId} initialCommentCount={post.commentCount} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Author Info */}
              <div className="card">
                <h3 className="font-bold text-lg mb-4">Yazar Hakkında</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                    {post.userPhotoURL ? (
                      <img 
                        src={post.userPhotoURL} 
                        alt={post.userName} 
                        className="w-10 h-10 rounded-full object-cover" 
                      />
                    ) : (
                      <span className="font-semibold">
                        {post.userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{post.userName}</p>
                    <p className="text-sm text-[var(--muted)]">MSÜ Adayı</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)] mb-4">
                  MSÜ mülakat sürecinde deneyimlerini paylaşan bir aday.
                </p>
                <button 
                  className="w-full btn-secondary text-sm"
                  onClick={() => router.push(`/profile/${post.userId}`)}
                >
                  Profili Görüntüle
                </button>
              </div>


              {/* Statistics */}
              <div className="card">
                <h3 className="font-bold text-lg mb-4">İstatistikler</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Görüntülenme</span>
                    <span className="font-medium">{viewCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Beğeni</span>
                    <span className="font-medium">{likeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Yorum</span>
                    <span className="font-medium">{post.commentCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
