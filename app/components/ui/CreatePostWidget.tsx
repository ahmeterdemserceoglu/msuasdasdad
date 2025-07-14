'use client';

import { useState } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';
import { Loader2, Send, MessageSquare, BookOpen, PenSquare } from 'lucide-react';

type PostType = 'deneyim' | 'soru' | 'bilgi';

export default function CreatePostWidget() {
    const { firebaseUser } = useAuth();
    const [activeTab, setActiveTab] = useState<PostType>('deneyim');
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTabChange = (tab: PostType) => {
        setActiveTab(tab);
        setContent('');
        setTitle('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !firebaseUser) {
            toast.error('Gönderi içeriği boş olamaz ve giriş yapmış olmalısınız.');
            return;
        }

        if (activeTab === 'deneyim' && !title.trim()) {
            toast.error('Deneyim paylaşımı için başlık zorunludur.');
            return;
        }

        setIsSubmitting(true);

        const postData = {
            postType: activeTab,
            content: content.trim(),
            title: activeTab === 'deneyim' ? title.trim() : content.trim().substring(0, 50),
            summary: content.trim().substring(0, 100),
            // Default values for other required fields
            interviewType: 'genel',
            candidateType: 'diger',
            experienceDate: new Date().toISOString(),
            tags: [activeTab]
        };

        try {
            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gönderi oluşturulamadı.');
            }

            toast.success('Gönderiniz başarıyla oluşturuldu ve onaya gönderildi!');
            setContent('');
            setTitle('');

        } catch (error) {
            console.error('Error creating post:', error);
            toast.error(error instanceof Error ? error.message : 'Bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderForm = () => {
        return (
            <form onSubmit={handleSubmit} className="p-4">
                {activeTab === 'deneyim' && (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Başlık"
                        className="w-full bg-transparent text-lg font-semibold placeholder-[var(--muted)] border-b border-[var(--border)] focus:ring-0 focus:border-[var(--primary)] mb-2 p-2 outline-none"
                    />
                )}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                        activeTab === 'deneyim' ? "Deneyimini paylaş..." :
                            activeTab === 'soru' ? "Sorunu sor..." :
                                "Bilgini paylaş..."
                    }
                    className="w-full bg-transparent text-lg placeholder-[var(--muted)] border-none focus:ring-0 resize-none p-2 outline-none"
                    rows={4}
                />
                <div className="flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || !content.trim()}
                        className="flex items-center space-x-2 bg-[var(--primary)] text-white font-bold py-2 px-4 rounded-full disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        <span>{isSubmitting ? 'Gönderiliyor...' : 'Gönder'}</span>
                    </button>
                </div>
            </form>
        );
    };

    if (!firebaseUser) return null;

    return (
        <div className="border-b border-[var(--border)] bg-[var(--background)]">
            <div className="flex">
                <button
                    onClick={() => handleTabChange('deneyim')}
                    className={`flex-1 p-4 text-center font-semibold flex items-center justify-center space-x-2 ${activeTab === 'deneyim' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--card-hover)]'}`}
                >
                    <PenSquare size={20} />
                    <span>Deneyim Paylaş</span>
                </button>
                <button
                    onClick={() => handleTabChange('soru')}
                    className={`flex-1 p-4 text-center font-semibold flex items-center justify-center space-x-2 ${activeTab === 'soru' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--card-hover)]'}`}
                >
                    <MessageSquare size={20} />
                    <span>Soru Sor</span>
                </button>
                <button
                    onClick={() => handleTabChange('bilgi')}
                    className={`flex-1 p-4 text-center font-semibold flex items-center justify-center space-x-2 ${activeTab === 'bilgi' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--card-hover)]'}`}
                >
                    <BookOpen size={20} />
                    <span>Bilgilendirme</span>
                </button>
            </div>
            {renderForm()}
        </div>
    );
} 