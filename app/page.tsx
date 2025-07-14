'use client';

import XLayout from './components/layout/XLayout';
import { Heart, MessageCircle, Smile, Sparkles, PenSquare, Plus, X, Hash, Calendar } from 'lucide-react';
import { useAuth } from './lib/auth-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from './components/ui/PostCard';
import { toast } from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'recent'>('featured');
  const [showPostForm, setShowPostForm] = useState(false);
  const [postType, setPostType] = useState('deneyim'); // deneyim, soru, bilgilendirme
  const [tags, setTags] = useState<{question: string, answer: string}[]>([]);
  const [currentTag, setCurrentTag] = useState({question: '', answer: ''});
  const [showAddTag, setShowAddTag] = useState(false);

  // Doğum yılı kontrolü - Google ile giriş yapan kullanıcılar için
  useEffect(() => {
    if (!authLoading && user && !user.birthYear) {
      toast.error('Profil bilgilerinizi tamamlamak için doğum yılınızı güncellemeniz gerekiyor.', {
        duration: 5000
      });
    }
  }, [user, authLoading]);

  // Postları getir
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      // Aktif tab'e göre sıralama parametresini belirle
      const sortParam = activeTab === 'featured' ? 'likes' : 'createdAt';
      const response = await fetch(`/api/posts?limit=20&status=approved&sort=${sortParam}`);
      const data = await response.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error: Error) {
      console.error('Postlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Paylaşım için işleyiciler
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleAddTag = () => {
    if (currentTag.question && currentTag.answer) {
      setTags([...tags, currentTag]);
      setCurrentTag({question: '', answer: ''});
      setShowAddTag(false);
    } else {
      toast.error('Lütfen hem soru hem de cevap girin');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Paylaşım yapmak için giriş yapmalısınız!');
      router.push('/login');
      return;
    }

    if (!content.trim()) {
      toast.error('Lütfen paylaşmak istediğiniz içeriği yazın.');
      return;
    }

    try {
      // Admin kontrolü - adminler için limit kontrolü yapma
      const isAdmin = user?.isAdmin || false;
      
      if (!isAdmin) {
        // Günlük limit kontrolü (sadece normal kullanıcılar için)
        const limitResponse = await fetch(`/api/posts/check-limit?userId=${user.uid}`);
        
        if (!limitResponse.ok) {
          const errorData = await limitResponse.json();
          toast.error(errorData.error || 'Limit kontrolü sırasında bir hata oluştu.');
          return;
        }
        
        const limitData = await limitResponse.json();
        
        if (!limitData.canPost) {
          toast.error(`Günlük paylaşım limitinize ulaştınız. Bugün 5/5 paylaşım yaptınız.`);
          return;
        }
      }

      // Get auth token
      const token = await firebaseUser?.getIdToken();
      
      if (!token) {
        toast.error('Kimlik doğrulama hatası. Lütfen tekrar giriş yapın.');
        return;
      }
      
      // Etiketleri hazırla
      const formattedTags = tags.reduce((acc, tag) => {
        acc[tag.question] = tag.answer;
        return acc;
      }, {} as Record<string, string>);
      
      // Post oluştur
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim(),
          postType,
          tags: formattedTags,
          isAnonymous: false,
          // Admin ise direkt approved yap
          status: isAdmin ? 'approved' : 'pending'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isAdmin) {
          toast.success('Paylaşımınız yayınlandı!');
        } else {
          toast.success('Paylaşımınız onay için gönderildi! Admin onayından sonra yayınlanacaktır.');
        }
        setContent('');
        setTags([]);
        setPostType('deneyim');
        setShowPostForm(false);
        // Postları yenile
        fetchPosts();
      } else {
        toast.error(data.error || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Paylaşım hatası:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const rightSidebar = (
    <div className="sticky top-4 space-y-4 animate-fade-in">
      {/* Son Paylaşımlar */}
      <div className="card">
        <h2 className="font-bold text-xl pb-2 border-b border-[var(--border)]">Son Paylaşımlar</h2>
        <div className="space-y-3 py-3">
          {posts.slice(0, 5).map((post) => (
            <div
              key={post.id}
              onClick={() => router.push(`/posts/${post.id}`)}
              className="hover:bg-[var(--card-hover)] px-2 py-2 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {post.userPhotoURL ? (
                    <img
                      src={post.userPhotoURL}
                      alt={post.userName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-semibold">
                      {post.userName?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[var(--foreground)] truncate">
                    {post.userName}
                  </p>
                  <p className="text-sm text-[var(--muted)] line-clamp-2">
                    {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
                  </p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-[var(--muted)]">
                      {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      <Heart className="w-3 h-3 inline mr-1" />
                      {post.likes || 0}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      <MessageCircle className="w-3 h-3 inline mr-1" />
                      {post.commentCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {posts.length > 5 && (
          <div className="pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => setActiveTab('recent')}
              className="text-[var(--primary)] hover:underline text-sm font-medium"
            >
              Tümünü göster
            </button>
          </div>
        )}
      </div>

      {/* MSÜ hakkında bilgi kartı - Genişletilmiş */}
      <div className="card">
        <h2 className="font-bold text-xl pb-2 border-b border-[var(--border)]">MSÜ Hakkında</h2>
        <div className="py-3 space-y-3">
          <p className="text-sm leading-relaxed text-[var(--foreground)]">
            Milli Savunma Üniversitesi (MSÜ), 31 Temmuz 2016'da Milli Savunma Bakanlığı'na bağlı olarak kurulan ve Türk Silahlı Kuvvetleri'nin subay ve astsubay ihtiyacını karşılayan askeri bir yükseköğretim kurumudur.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-[var(--foreground)]">Akademik Yapı:</h3>
            <p className="text-sm text-[var(--muted)]">
              Üniversite; harp okullarında lisans, astsubay meslek yüksekokullarında ön lisans ve enstitülerde lisansüstü eğitim vermektedir.
            </p>
            <ul className="text-sm text-[var(--muted)] space-y-1 ml-4 list-disc list-inside">
              <li>Kara, Deniz, Hava Harp Okulları</li>
              <li>Kara, Deniz, Hava Astsubay MYO</li>
              <li>Bando Astsubay MYO</li>
              <li>Lisansüstü eğitim enstitüleri</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-[var(--foreground)]">Adaylık Süreci:</h3>
            <p className="text-sm text-[var(--muted)]">
              Adaylar, ÖSYM tarafından yapılan MSÜ Askeri Öğrenci Aday Belirleme Sınavı ve YKS'ye katıldıktan sonra fiziki yeterlilik, mülakat ve sağlık muayenesi gibi aşamalardan geçerler.
            </p>
          </div>

          <p className="text-xs text-[var(--muted)] italic">
            Bu platform, MSÜ adaylarının mülakat deneyimlerini paylaşarak birbirlerine destek olmalarını amaçlar.
          </p>
        </div>
        <div className="pt-2 border-t border-[var(--border)] space-y-2">
          <a
            href="https://www.msu.edu.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline text-sm font-medium block"
          >
            MSÜ Resmi Web Sitesi
          </a>
          <a
            href="https://msubf2025.msu.edu.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline text-sm font-medium block"
          >
            2025 Başvuru Kılavuzu
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <XLayout rightSidebar={rightSidebar}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="p-4">
          <h1 className="text-xl font-bold">Ana Sayfa</h1>
        </div>
        <div className="flex">
          <button
            onClick={() => setActiveTab('featured')}
            className={`flex-1 text-center font-semibold p-3 hover:bg-[var(--card-hover)] transition-colors cursor-pointer ${
              activeTab === 'featured'
                ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                : 'text-[var(--muted)]'
            }`}
          >
            Öne Çıkanlar
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 text-center font-semibold p-3 hover:bg-[var(--card-hover)] transition-colors cursor-pointer ${
              activeTab === 'recent'
                ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                : 'text-[var(--muted)]'
            }`}
          >
            Son Paylaşımlar
          </button>
        </div>
      </header>

      {/* Doğum yılı eksik uyarısı */}
      {user && !user.birthYear && (
        <div className="p-4 border-b border-[var(--border)] bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Profil bilgilerinizi tamamlamak için doğum yılınızı güncellemeniz gerekiyor.
              </p>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
            >
              Profili Tamamla
            </button>
          </div>
        </div>
      )}

      {/* Paylaşım oluşturma alanı */}
      <div className="p-4 border-b border-[var(--border)] animate-fade-in">
        {!showPostForm ? (
          <button
            onClick={() => setShowPostForm(true)}
            className="w-full flex items-center justify-center space-x-3 p-4 bg-[var(--card-hover)] hover:bg-[var(--card-hover)]/80 rounded-lg transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <PenSquare size={20} />
            <span>Deneyimini paylaş veya soru sor...</span>
          </button>
        ) : (
          <div className="space-y-4">
            {/* Paylaşım Türü Seçimi */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Paylaşım Oluştur</h3>
              <button
                onClick={() => {
                  setShowPostForm(false);
                  setContent('');
                  setTags([]);
                  setPostType('deneyim');
                }}
                className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Paylaşım Tipi */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPostType('deneyim')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  postType === 'deneyim'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--card-hover)] text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <MessageCircle size={16} className="inline mr-2" />
                Deneyim Paylaşımı
              </button>
              <button
                onClick={() => setPostType('soru')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  postType === 'soru'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--card-hover)] text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Hash size={16} className="inline mr-2" />
                Soru-Cevap
              </button>
              <button
                onClick={() => setPostType('bilgilendirme')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  postType === 'bilgilendirme'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--card-hover)] text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Sparkles size={16} className="inline mr-2" />
                Bilgilendirme
              </button>
            </div>

            {/* İçerik Alanı */}
            <div className="bg-[var(--card-hover)] rounded-lg p-4">
              <textarea
                placeholder={
                  postType === 'deneyim'
                    ? 'Mülakat deneyimini detaylı bir şekilde paylaş...'
                    : postType === 'soru'
                    ? 'Merak ettiğin soruyu sor...'
                    : 'Bilgilendirme mesajını yaz...'
                }
                value={content}
                onChange={handleContentChange}
                className="w-full bg-transparent text-lg focus:outline-none resize-none placeholder-[var(--muted)] min-h-[120px]"
              ></textarea>
            </div>

            {/* Etiketler */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[var(--foreground)]">Etiketler</h4>
                <button
                  onClick={() => setShowAddTag(true)}
                  className="text-sm text-[var(--primary)] hover:underline flex items-center space-x-1"
                >
                  <Plus size={16} />
                  <span>Etiket Ekle</span>
                </button>
              </div>

              {/* Mevcut Etiketler */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-[var(--card-hover)] rounded-lg p-3"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {tag.question}:
                        </span>
                        <span className="text-sm text-[var(--muted)] ml-2">
                          {tag.answer}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveTag(index)}
                        className="p-1 hover:bg-[var(--background)] rounded transition-colors"
                      >
                        <X size={16} className="text-[var(--muted)]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Yeni Etiket Ekleme Formu */}
              {showAddTag && (
                <div className="bg-[var(--card-hover)] rounded-lg p-4 space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Soru (Örn: Mülakat Türü, Şehir, Aday Türü)"
                      value={currentTag.question}
                      onChange={(e) => setCurrentTag({ ...currentTag, question: e.target.value })}
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Cevap (Örn: Sözlü Mülakat, Ankara, Subay)"
                      value={currentTag.answer}
                      onChange={(e) => setCurrentTag({ ...currentTag, answer: e.target.value })}
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowAddTag(false);
                        setCurrentTag({ question: '', answer: '' });
                      }}
                      className="px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Paylaş Butonu */}
            <div className="flex justify-between items-center pt-4">
              <div className="flex space-x-2">
                <button className="p-2 rounded-full hover:bg-[var(--card-hover)] text-[var(--muted)] transition-colors">
                  <Smile size={20} />
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {user?.isAdmin ? 'Direkt Yayınla' : 'Paylaş'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feed İçeriği */}
      <div className="animate-fade-in">
        {loading ? (
          <div className="py-8 px-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
            <p className="text-[var(--muted)] mt-4">Yükleniyor...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4 p-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                content={post.content}
                summary={post.summary}
                userId={post.userId}
                userName={post.userName}
                userPhotoURL={post.userPhotoURL}
                interviewType={post.interviewType}
                candidateType={post.candidateType}
                city={post.city}
                tags={post.tags || []}
                postType={post.postType}
                likes={post.likes || 0}
                commentCount={post.commentCount || 0}
                viewCount={post.viewCount || 0}
                createdAt={post.createdAt}
                experienceDate={post.experienceDate}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 px-4 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-[var(--primary-light)] rounded-full p-3 inline-block mb-4">
                <Sparkles className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Henüz içerik yok</h2>
              <p className="text-[var(--muted)] mb-6">
                MSÜ mülakatlarıyla ilgili deneyimlerini paylaş, sorular sor ve diğer adaylarla etkileşime geç!
              </p>
              <button 
                className="btn-primary"
                onClick={() => {
                  const textarea = document.querySelector('textarea');
                  if (textarea) {
                    textarea.focus();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                İlk Paylaşımı Yap
              </button>
            </div>
          </div>
        )}
      </div>
    </XLayout>
  );
}
