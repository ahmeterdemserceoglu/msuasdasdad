import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const candidateTypeLabels = {
  subay: 'Subay Adayı',
  astsubay: 'Astsubay Adayı',
  harbiye: 'Harbiye',
  'sahil-guvenlik': 'Sahil Güvenlik',
  jandarma: 'Jandarma'
};

export const interviewTypeLabels = {
  sozlu: 'Sözlü Mülakat',
  spor: 'Spor Mülakatı',
  evrak: 'Evrak İncelemesi',
  psikolojik: 'Psikolojik Test',
  diger: 'Diğer'
};

export const interviewTypeColors = {
  sozlu: 'bg-blue-100 text-blue-800',
  spor: 'bg-green-100 text-green-800',
  evrak: 'bg-yellow-100 text-yellow-800',
  psikolojik: 'bg-purple-100 text-purple-800',
  diger: 'bg-gray-100 text-gray-800'
};

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'az önce';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
  
  return formatDate(d);
}
