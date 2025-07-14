import React from 'react';
import Card from './Card';
import Button from './Button';

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
        return <img src="/icons/instagram.svg" alt="Instagram" className="w-6 h-6" />;
      case 'telegram':
        return <img src="/icons/telegram.svg" alt="Telegram" className="w-6 h-6" />;
      case 'twitter':
        return <img src="/icons/twitter.svg" alt="Twitter" className="w-6 h-6" />;
      case 'facebook':
        return <img src="/icons/facebook.svg" alt="Facebook" className="w-6 h-6" />;
      case 'youtube':
        return <img src="/icons/youtube.svg" alt="YouTube" className="w-6 h-6" />;
      default:
        return <img src="/icons/globe.svg" alt="Website" className="w-6 h-6" />;
    }
  };

  return (
    <Card className="p-4 flex flex-col items-center text-center">
      {account.imageUrl && (
        <img src={account.imageUrl} alt={account.name} className="w-24 h-24 object-cover rounded-full mb-4" />
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
          Telegram'a Katıl
        </Button>
      )}
    </Card>
  );
};

export default CommunityAccountCard;
