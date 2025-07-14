'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import Button from '../ui/Button';
import { Home, FileText, PlusCircle, BookOpen, Shield, LogOut, Menu, X, Sun, Moon, ChevronDown, Settings, Users, Bell, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/app/lib/utils';
import { useAdminNotifications } from '@/app/lib/useAdminNotifications';

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const { notifications, totalCount } = useAdminNotifications();
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dark mode kontrolü
    const isDark = localStorage.getItem('darkMode') === 'true' || 
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  // Dropdown dışı tıklamayı handle et
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    document.documentElement.classList.toggle('dark', newMode);
  };

  const navItems = [
    { href: '/', label: 'Ana Sayfa', icon: Home },
    { href: '/feed', label: 'Paylaşımlar', icon: FileText },
    { href: '/share', label: 'Paylaş', icon: PlusCircle, authRequired: true },
    { href: '/guide', label: 'Rehber', icon: BookOpen },
    { href: '/interview-buddy', label: 'Mülakat Arkadaşları', icon: Users },
  ];

  if (user?.isAdmin) {
    navItems.push({ href: '/admin', label: 'Admin', icon: Shield, authRequired: true });
  }

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-military-green" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">MSÜ Rehber</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              if (item.authRequired && !user) return null;
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-military-green text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Admin Notifications */}
            {user?.isAdmin && (
              <div className="relative" ref={notificationDropdownRef}>
                <button
                  onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                  className="relative p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Admin bildirimleri"
                >
                  <Bell className="h-5 w-5" />
                  {totalCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalCount > 99 ? '99+' : totalCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {isNotificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium text-gray-900 dark:text-white">Admin Bildirimleri</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div key={notification.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {notification.type === 'pending_post' && (
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                )}
                                {notification.type === 'new_user' && (
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(notification.timestamp).toLocaleString('tr-TR')}
                                </p>
                              </div>
                              {notification.type === 'pending_post' && (
                                <Link
                                  href="/admin?tab=pending"
                                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  onClick={() => setIsNotificationDropdownOpen(false)}
                                >
                                  Görüntüle
                                </Link>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Yeni bildirim yok</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        href="/admin"
                        className="block w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        onClick={() => setIsNotificationDropdownOpen(false)}
                      >
                        Tüm bildirimleri görüntüle
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Admin Dropdown */}
            {user?.isAdmin && (
              <div className="relative" ref={adminDropdownRef}>
                <button
                  onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Admin</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {/* Admin Dropdown Menu */}
                {isAdminDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-2">
                      <Link
                        href="/admin"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsAdminDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Genel Yönetim</span>
                      </Link>
                      <Link
                        href="/admin/users"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsAdminDropdownOpen(false)}
                      >
                        <Users className="h-4 w-4" />
                        <span>Kullanıcı Yönetimi</span>
                      </Link>
                      <Link
                        href="/admin?tab=pending"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsAdminDropdownOpen(false)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Onay Bekleyenler</span>
                        {totalCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                            {totalCount}
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Tema değiştir"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <Link 
                  href="/profile" 
                  className="flex items-center space-x-2 text-sm hover:opacity-80 transition-opacity"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-military-green flex items-center justify-center text-white">
                      {user.displayName[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-gray-700 dark:text-gray-300">{user.displayName}</span>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış</span>
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Giriş Yap</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Kayıt Ol</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              if (item.authRequired && !user) return null;
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-md transition-colors',
                    isActive
                      ? 'bg-military-green text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* User Info / Auth Buttons in Mobile */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              {user ? (
                <>
                  <Link 
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-military-green flex items-center justify-center text-white">
                        {user.displayName[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Çıkış Yap</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full"
                  >
                    <Button variant="outline" className="w-full">Giriş Yap</Button>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full"
                  >
                    <Button className="w-full">Kayıt Ol</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
