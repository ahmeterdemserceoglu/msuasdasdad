'use client';

import XLayout from '../components/layout/XLayout';
import { BookOpen, ShieldCheck, Dumbbell, Users, HeartPulse, Award, Info } from 'lucide-react';

const guideSections = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-blue-500" />,
    title: 'Başvuru ve Sınav Süreci',
    content: 'MSÜ yolculuğu, ÖSYM üzerinden yapılan başvuru ile başlar. Adaylar, MSÜ Askeri Öğrenci Aday Belirleme Sınavı\'na girerler. Bu sınavdan alınan puan, ikinci seçim aşamalarına çağrılmak için kritik öneme sahiptir. YKS\'ye (TYT ve AYT) girmek de zorunludur.',
  },
  {
    icon: <Dumbbell className="w-8 h-8 text-green-500" />,
    title: 'Fiziki Yeterlilik Testi (FYT)',
    content: 'FYT, adayların fiziki dayanıklılığını ölçer. Parkur; şınav, mekik, 400 metre koşu gibi çeşitli istasyonlardan oluşur. Her istasyonun belirli bir baraj puanı vardır ve başarılı olmak için bu puanları geçmek gerekir. Antrenmanlı olmak büyük avantaj sağlar.',
  },
  {
    icon: <Users className="w-8 h-8 text-purple-500" />,
    title: 'Sözlü Mülakat',
    content: 'Sözlü mülakat, adayın kendini ifade etme becerisini, özgüvenini, vatan sevgisini ve genel kültürünü ölçmeyi amaçlar. Genellikle bir komisyon karşısında yapılır. Düzgün bir diksiyon, kendinden emin bir duruş ve dürüst cevaplar önemlidir.',
  },
  {
    icon: <HeartPulse className="w-8 h-8 text-red-500" />,
    title: 'Sağlık Muayenesi',
    content: 'Bu aşamada adayların, TSK Sağlık Yeteneği Yönetmeliği\'nde belirtilen sağlık şartlarını taşıyıp taşımadığı kontrol edilir. Tam teşekküllü bir askeri hastanede yapılan detaylı bir muayene sürecidir. Göz, diş, ortopedi gibi birçok alanda kontrol yapılır.',
  },
  {
    icon: <Award className="w-8 h-8 text-yellow-500" />,
    title: 'Genel Tavsiyeler',
    content: 'Sürecin her aşamasına iyi hazırlanın. Resmi duyuruları (MSÜ ve Personel Temin siteleri) düzenli olarak takip edin. Mülakatlarda sakin, dürüst ve saygılı olun. Spor testleri için önceden antrenman yapın ve kendinize güvenin.',
  },
];

export default function GuidePage() {
  return (
    <XLayout containerClassName="max-w-7xl mx-auto min-h-screen relative">
      <header className="sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)] p-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-[var(--primary)]" />
          <h1 className="text-xl font-bold">MSÜ Aday Rehberi</h1>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-8 animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">Başarıya Giden Yol</h2>
          <p className="text-md text-[var(--muted)] mt-2 max-w-2xl mx-auto">
            Milli Savunma Üniversitesi'ne giden bu zorlu ama onurlu yolda, her adımı sağlam atmanız için bu rehberi hazırladık.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guideSections.map((section, index) => (
            <div key={index} className="card p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300">
              <div className="p-3 bg-[var(--primary-light)] rounded-full mb-4">
                {section.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-[var(--foreground)]">{section.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="card bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
            <div className="flex items-start space-x-3">
                <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-blue-800 dark:text-blue-300">Önemli Not</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                        Bu rehber genel bilgilendirme amaçlıdır. Başvuru ve seçim süreçleriyle ilgili en güncel ve doğru bilgi için her zaman Milli Savunma Üniversitesi (msu.edu.tr) ve MSB Personel Temin (personeltemin.msb.gov.tr) resmi web sitelerini takip ediniz.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </XLayout>
  );
}
