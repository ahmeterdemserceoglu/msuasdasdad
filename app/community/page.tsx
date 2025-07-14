'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import XLayout from '../components/layout/XLayout';
import { Users, ArrowLeft } from 'lucide-react';
import CommunityAccountCard from '../components/ui/CommunityAccountCard';

interface CommunityAccount {
  id: string;
  type: string;
  name: string;
  url: string;
  imageUrl?: string | null;
}

export default function CommunityPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<CommunityAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        // In a real application, you'd likely fetch this from a public API endpoint
        // or a Firebase client-side fetch if rules allow.
        // For now, we'll simulate a fetch or assume a public endpoint exists.
        // If this were an authenticated endpoint, you'd need to handle auth here.
        const res = await fetch('/api/community-accounts');
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
        } else {
          setError('Failed to fetch community accounts.');
        }
      } catch (err) {
        console.error('Error fetching community accounts:', err);
        setError('Error fetching community accounts.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleJoinTelegram = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <XLayout containerClassName="max-w-7xl mx-auto min-h-screen relative">
        <header className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)] p-4">
          <div className="flex items-center space-x-3">
            <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-[var(--card-hover)]">
              <ArrowLeft size={20} />
            </button>
            <Users className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-xl font-bold">Topluluğumuza Katılın</h1>
          </div>
        </header>
        <div className="p-4 md:p-6 text-center">Yükleniyor...</div>
      </XLayout>
    );
  }

  if (error) {
    return (
      <XLayout containerClassName="max-w-7xl mx-auto min-h-screen relative">
        <header className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)] p-4">
          <div className="flex items-center space-x-3">
            <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-[var(--card-hover)]">
              <ArrowLeft size={20} />
            </button>
            <Users className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-xl font-bold">Topluluğumuza Katılın</h1>
          </div>
        </header>
        <div className="p-4 md:p-6 text-center text-red-500">{error}</div>
      </XLayout>
    );
  }

  return (
    <XLayout containerClassName="max-w-7xl mx-auto min-h-screen relative">
      <header className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)] p-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-[var(--card-hover)]">
            <ArrowLeft size={20} />
          </button>
          <Users className="w-6 h-6 text-[var(--primary)]" />
          <h1 className="text-xl font-bold">Topluluğumuza Katılın</h1>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-8 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">Daha Güçlü Bir Aday Olun</h2>
          <p className="text-md text-[var(--muted)] mt-2 max-w-2xl mx-auto">
            Binlerce adayla bir araya gelin, bilgi alışverişinde bulunun ve MSÜ yolculuğunda yalnız olmadığınızı hissedin.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <CommunityAccountCard key={account.id} account={account} onJoinTelegram={handleJoinTelegram} />
          ))}
        </div>

        {accounts.length === 0 && !loading && !error && (
          <div className="text-center text-gray-500">
            Henüz eklenecek topluluk hesabı bulunmamaktadır.
          </div>
        )}

        <div className="text-center text-sm text-[var(--muted)] pt-8">
          <p>Not: Bu platformlar MSÜ Rehber topluluğu tarafından yönetilmektedir ve resmi kurumlar değildir.</p>
        </div>
      </div>
    </XLayout>
  );
}