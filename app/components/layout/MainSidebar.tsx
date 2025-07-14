'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { db } from '@/app/lib/firebase'; // Adjust the path as necessary
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/app/lib/auth-context';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import {
  Home,
  User,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  HelpCircle,
  UsersRound,
  UserCheck
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

export default function MainSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [unreadRequestCount, setUnreadRequestCount] = useState(0);
  const pathname = usePathname();
  const { user, firebaseUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const navItems: NavItem[] = [
    {
      name: 'Ana Sayfa',
      href: '/',
      icon: <Home className="w-5 h-5" />,
    },
    {
      name: 'Rehber',
      href: '/guide',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      name: 'Mülakat Soruları',
      href: '/interview-questions',
      icon: <HelpCircle className="w-5 h-5" />,
      requiresAuth: true,
    },
    {
      name: 'Topluluk',
      href: '/community',
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: 'Mülakat Arkadaşları',
      href: '/interview-buddy',
      icon: <UsersRound className="w-5 h-5" />,
      requiresAuth: true,
    },
    {
      name: 'Arkadaşlarım',
      href: '/friends',
      icon: <span className="relative">
        <UserCheck className="w-5 h-5" />
        {unreadRequestCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
            {unreadRequestCount}
          </span>
        )}
      </span>,
      requiresAuth: true,
    },
    {
      name: 'Bildirimler',
      href: '/notifications',
      icon: <Bell className="w-5 h-5" />,
      requiresAuth: true,
    },
    {
      name: 'Profil',
      href: '/profile',
      icon: <User className="w-5 h-5" />,
      requiresAuth: true,
    },
    {
      name: 'Ayarlar',
      href: '/settings',
      icon: <Settings className="w-5 h-5" />,
      requiresAuth: true,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const filteredNavItems = navItems.filter(item =>
    !item.requiresAuth || (item.requiresAuth && user)
  );

  // Mount state for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!firebaseUser) return;

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch('/api/notifications/unread-count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    if (user) {
      fetchUnreadCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, firebaseUser, pathname]); // Refresh when pathname changes

  // Firestore listener for pending friend requests
  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, 'friendRequests'),
      where('status', '==', 'pending'),
      where('read', '==', false),
      where('to', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setUnreadRequestCount(querySnapshot.size);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  return (
    <>
      {/* Mobile menu overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 xl:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-20 xl:w-72 bg-[var(--background)] border-r border-[var(--border)] transform transition-transform duration-300 ease-in-out xl:translate-x-0 ${isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-military-green to-military-green-dark rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div className="hidden xl:block">
              <h1 className="text-lg font-bold text-[var(--foreground)]">MSÜ Rehber</h1>
              <p className="text-xs text-[var(--muted)]">MSÜ Hakkında</p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="xl:hidden text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'Profil'}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium text-sm">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="hidden xl:block min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                  {user.displayName || 'Kullanıcı'}
                </p>
                <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${isActive(item.href)
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]'
                    }`}
                  title={item.name}
                >
                  <span className="flex-shrink-0 relative">
                    {item.icon}
                    {item.href === '/notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="hidden xl:block truncate">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-[var(--border)] space-y-3">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] rounded-lg transition-colors"
              title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Moon className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="hidden xl:block">
                {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
              </span>
            </button>
          )}

          {user ? (
            <button
              onClick={logout}
              className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="hidden xl:block">Çıkış Yap</span>
            </button>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                className="flex items-center justify-center space-x-3 w-full px-3 py-2.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors shadow-sm"
              >
                <LogIn className="w-5 h-5 flex-shrink-0" />
                <span className="hidden xl:block">Giriş Yap</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center space-x-3 w-full px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:text-[var(--foreground)] bg-[var(--card-hover)] hover:bg-[var(--card-hover)]/80 border border-[var(--border)] rounded-lg transition-colors"
              >
                <UserPlus className="w-5 h-5 flex-shrink-0" />
                <span className="hidden xl:block">Kayıt Ol</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-4 left-4 z-40 xl:hidden bg-[var(--background)] p-2 rounded-md shadow-lg border border-[var(--border)]"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
