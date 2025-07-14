'use client';

import { useEffect, useState } from 'react';

interface PostLimitIndicatorProps {
  userId: string | null;
  onLimitCheck?: (canPost: boolean, remainingPosts: number) => void;
}

export default function PostLimitIndicator({ userId, onLimitCheck }: PostLimitIndicatorProps) {
  
  const [postsToday, setPostsToday] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const DAILY_LIMIT = 5;

  useEffect(() => {
    const checkLimit = async () => {
      if (!userId) {
        setRemainingPosts(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/posts/check-limit?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to check post limit');
        }
const { canPost, remainingPosts, postsToday } = await response.json();
        setPostsToday(postsToday);
        if (onLimitCheck) {
          onLimitCheck(canPost, remainingPosts);
        }
      } catch (error) {
        console.error('Error checking post limit:', error);
        setRemainingPosts(null);
      } finally {
        setLoading(false);
      }
    };

    checkLimit();
  }, [userId, onLimitCheck]);

if (!userId || loading || postsToday === null) {
    return null;
  }

const getIndicatorColor = () => {
    if (postsToday === DAILY_LIMIT) return 'text-red-500';
    if (postsToday >= DAILY_LIMIT * 0.75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getIndicatorMessage = () => {
    return `Bugün ${postsToday}/${DAILY_LIMIT} paylaşım yaptınız.`;
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${getIndicatorColor()}`}>
      <svg
        className="w-4 h-4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>{getIndicatorMessage()}</span>
    </div>
  );
}
