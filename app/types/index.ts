export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  birthYear: number;
  city?: string; // User's city
  isAdmin?: boolean;
  createdAt: Date; // Firestore Timestamp veya Date
  bio?: string; // Add bio property
  likedPosts?: string[]; // Array of post IDs the user has liked
  savedPosts?: string[]; // Array of post IDs the user has saved
  interviewDate?: Date; // Mülakat tarihi
  interviewTime?: string; // Mülakat saati
  isOnline?: boolean; // Online durumu
  lastSeen?: Date; // Son görülme
  friends?: string[]; // Arkadaş listesi (user id'leri)
  friendRequests?: string[]; // Gelen arkadaşlık istekleri
  sentFriendRequests?: string[]; // Gönderilen arkadaşlık istekleri
  interviewCity?: string; // Mülakat şehri
  interviewBranch?: CandidateType; // Mülakat branşı
}

export type CandidateType =
  | 'subay'
  | 'astsubay'
  | 'harbiye'
  | 'sahil-guvenlik'
  | 'jandarma';

export type InterviewType =
  | 'sozlu'
  | 'spor'
  | 'evrak'
  | 'psikolojik'
  | 'diger';

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  title: string;
  summary: string;
  content: string;
  interviewType: InterviewType;
  candidateType: CandidateType;
  experienceDate: Date;
  city?: string;
  tags: string[];
  likes: string[]; // user ids
  likeCount: number;
  commentCount: number;
  isApproved: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  viewCount?: number;
  postType?: 'deneyim' | 'soru' | 'bilgi';
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  likeCount?: number;
  parentId?: string; // For replies
  replyCount?: number; // Number of replies
  createdAt: Date;
}

export interface GuideSection {
  id: string;
  title: string;
  slug: string;
  content: string;
  order: number;
  category: 'spor' | 'sozlu' | 'evrak' | 'psikolojik' | 'genel';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPostLimit {
  userId: string;
  date: string; // YYYY-MM-DD format
  postCount: number;
}

export type NotificationType =
  | 'post_approved'
  | 'post_rejected'
  | 'like'
  | 'post_commented'
  | 'comment_liked'
  | 'comment_replied'
  | 'new_post'
  | 'new_user';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  postId?: string;
  commentId?: string;
  fromUserId?: string;
  read: boolean;
  createdAt: Date;
}

export interface AdminNotification {
  id: string;
  type: NotificationType;
  count: number;
  message: string;
  timestamp: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[]; // User id'leri
  lastMessage?: Message;
  lastMessageTime?: Date;
  unreadCount?: { [userId: string]: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface CommunityAccount {
  id?: string;
  type: string;
  name: string;
  url: string;
  imageUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}