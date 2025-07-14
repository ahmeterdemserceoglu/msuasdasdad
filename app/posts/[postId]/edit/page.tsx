'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, X } from 'lucide-react';

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
  experienceDate: string;
  status: string;
}

const INTERVIEW_TYPES = [
  { value: 'sozlu', label: 'Sözlü Mülakat' },
  { value: 'spor', label: 'Spor Testi' },
  { value: 'evrak', label: 'Evrak İncelemesi' },
  { value: 'psikolojik', label: 'Psikolojik Test' },
  { value: 'diger', label: 'Diğer' },
  { value: 'genel', label: 'Genel' }
];

const CANDIDATE_TYPES = [
  { value: 'subay', label: 'Subay' },
  { value: 'astsubay', label: 'Astsubay' },
  { value: 'harbiye', label: 'Harbiye' },
  { value: 'sahil-guvenlik', label: 'Sahil Güvenlik' },
  { value: 'jandarma', label: 'Jandarma' },
  { value: 'diger', label: 'Diğer' }
];

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { firebaseUser } = useAuth();


  const [, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [interviewType, setInterviewType] = useState('genel');
  const [candidateType, setCandidateType] = useState('subay');
  const [city, setCity] = useState('');
  const [experienceDate, setExperienceDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Fetch post data and check permissions
  useEffect(() => {
    const fetchPost = async () => {
      if (!firebaseUser) {
        router.push('/auth/login');
        return;
      }

      try {
        setLoading(true);
        const token = await firebaseUser.getIdToken();

        // First check permissions
        const permissionResponse = await fetch(`/api/posts/${postId}`, {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!permissionResponse.ok) {
          setError('Yetki kontrolü başarısız oldu');
          return;
        }

        const permissionData = await permissionResponse.json();

        // Check if user is owner or admin
        if (!permissionData.isOwner && !permissionData.isAdmin) {
          setError('Bu postu düzenleme yetkiniz yok');
          return;
        }

        // Fetch post data
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
        const postData = data.post;

        setPost(postData);

        // Fill form with existing data
        setTitle(postData.title || '');
        setContent(postData.content || '');
        setSummary(postData.summary || '');
        setInterviewType(postData.interviewType || 'genel');
        setCandidateType(postData.candidateType || 'subay');
        setCity(postData.city || '');
        setTags(postData.tags || []);

        // Format date for input
        if (postData.experienceDate) {
          const date = new Date(postData.experienceDate);
          const formattedDate = date.toISOString().split('T')[0];
          setExperienceDate(formattedDate);
        }

      } catch (err: unknown) {
        console.error('Error fetching post:', err);
        setError('Post yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, firebaseUser, router]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firebaseUser) {
      toast.error('Giriş yapmanız gerekiyor');
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error('Başlık ve içerik zorunludur');
      return;
    }

    setSubmitting(true);

    try {
      const token = await firebaseUser.getIdToken();

      const updateData = {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        interviewType,
        candidateType,
        city: city.trim(),
        tags,
        experienceDate: experienceDate || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Güncelleme başarısız oldu');
      }

      toast.success('Post başarıyla güncellendi');
      router.push(`/posts/${postId}`);
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error instanceof Error ? error.message : 'Güncelleme sırasında hata oluştu');
    } finally {
      setSubmitting(false);
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Hata</h2>
          <p className="text-[var(--muted)] mb-6">{error}</p>
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-[var(--card-hover)] rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-[var(--foreground)]" />
              </button>
              <h1 className="text-xl font-bold">Post Düzenle</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="card">
            <label className="block text-sm font-medium mb-2">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="Deneyiminizi özetleyen bir başlık girin"
              required
            />
          </div>

          {/* Summary */}
          <div className="card">
            <label className="block text-sm font-medium mb-2">
              Özet
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              placeholder="Deneyiminizin kısa bir özetini yazın (opsiyonel)"
              rows={3}
            />
          </div>

          {/* Content */}
          <div className="card">
            <label className="block text-sm font-medium mb-2">
              İçerik <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              placeholder="Deneyiminizi detaylı bir şekilde anlatın"
              rows={10}
              required
            />
          </div>

          {/* Interview Type & Candidate Type */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mülakat Türü
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  {INTERVIEW_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Aday Türü
                </label>
                <select
                  value={candidateType}
                  onChange={(e) => setCandidateType(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  {CANDIDATE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* City & Experience Date */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Şehir
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  placeholder="Mülakat şehri (opsiyonel)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Deneyim Tarihi
                </label>
                <input
                  type="date"
                  value={experienceDate}
                  onChange={(e) => setExperienceDate(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="card">
            <label className="block text-sm font-medium mb-2">
              Etiketler
            </label>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Etiket ekle ve Enter'a bas"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn-secondary"
              >
                Ekle
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-[var(--primary-light)] text-[var(--primary)] text-sm rounded-full"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="card">
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
                disabled={submitting}
              >
                İptal
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Güncelleniyor...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Güncelle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
