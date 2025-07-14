'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import Button from '@/app/components/ui/Button';
import { CheckCircle, ExternalLink, User, Eye, ThumbsUp, MessageCircle, Calendar } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  userEmail: string;
  displayName: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  likes?: number;
  comments?: number;
  views?: number;
}

const ApprovedPostsPage = () => {
  const { firebaseUser: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApprovedPosts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/posts/admin?status=approved', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error('Failed to fetch approved posts');
      }
    } catch (error) {
      console.error('Error fetching approved posts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchApprovedPosts();
  }, [fetchApprovedPosts]);

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Onaylanmış Gönderiler
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Yayında olan ve kullanıcılar tarafından görülebilen gönderiler
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Onaylanmış</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Görüntülenme</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {posts.reduce((sum, post) => sum + (post.views || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Beğeni</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {posts.reduce((sum, post) => sum + (post.likes || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Yorum</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {posts.reduce((sum, post) => sum + (post.comments || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Gönderi başlığı, içerik veya yazar adı ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz onaylanmış gönderi yok'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Farklı terimlerle arama yapmayı deneyin.' : 'Bekleyen gönderiler onaylandığında burada görünecek.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {post.content}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Onaylandı
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {post.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{post.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments || 0}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => window.open(`/post/${post.id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Görüntüle
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovedPostsPage;