import React from 'react';
import Card from './Card';
import Button from './Button';
import Image from 'next/image';

interface CommunityAccountCardProps {
  account: {
    id: string;
    type: string;
    name: string;
    url: string;
    imageUrl?: string | null;
  };
  onJoinTelegram?: (url: string) => void;
}

const CommunityAccountCard: React.FC<CommunityAccountCardProps> = ({ account, onJoinTelegram }) => {
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'instagram':
        return <Image src="/icons/instagram.svg" alt="Instagram" width={24} height={24} />;
      case 'telegram':
        return <Image src="/icons/telegram.svg" alt="Telegram" width={24} height={24} />;
      case 'twitter':
        return <Image src="/icons/twitter.svg" alt="Twitter" width={24} height={24} />;
      case 'facebook':
        return <Image src="/icons/facebook.svg" alt="Facebook" width={24} height={24} />;
      case 'youtube':
        return <Image src="/icons/youtube.svg" alt="YouTube" width={24} height={24} />;
      default:
        return <Image src="/icons/globe.svg" alt="Website" width={24} height={24} />;
    }
  };

  return (
    <Card className="p-4 flex flex-col items-center text-center">
      {account.imageUrl && (
        <Image src={account.imageUrl} alt={account.name} width={96} height={96} className="w-24 h-24 object-cover rounded-full mb-4" />
      )}
      <div className="mb-2">
        {getIcon(account.type)}
      </div>
      <h3 className="text-xl font-semibold mb-2">{account.name}</h3>
      <p className="text-gray-600 mb-4">{account.type} Hesabı</p>
      <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mb-4">
        Profili Ziyaret Et
      </a>
      {account.type.toLowerCase() === 'telegram' && onJoinTelegram && (
        <Button onClick={() => onJoinTelegram(account.url)} className="mt-2">
          Telegram&apos;a Katıl
        </Button>
      )}
    </Card>
  );
};

export default CommunityAccountCard;
