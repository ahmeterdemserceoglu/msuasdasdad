'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { useAdminNotifications } from '@/app/lib/useAdminNotifications';
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  Users, 
  Flag, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  ArrowLeft,
  Share2,
  CheckCircle,
  Shield,
  Globe
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  category?: string;
}

interface NavCategory {
  name: string;
  items: NavItem[];
}

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { notifications } = useAdminNotifications();

  const pendingPostsCount = notifications.find(n => n.type === 'pending_post')?.count || 0;
  const reportedContentCount = notifications.find(n => n.type === 'reported_content')?.count || 0;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      setIsCollapsed(mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navCategories: NavCategory[] = [
    {
      name: 'Genel',
      items: [
        { name: 'Ana Panel', href: '/admin', icon: LayoutDashboard },
      ]
    },
    {
      name: 'İçerik Yönetimi',
      items: [
        { name: 'Tüm Gönderiler', href: '/admin/posts', icon: FileText },
        { name: 'Onay Bekleyenler', href: '/admin/posts/pending', icon: Clock, badge: pendingPostsCount },
        { name: 'Onaylanmış İçerik', href: '/admin/posts/approved', icon: CheckCircle },
      ]
    },
    {
      name: 'Kullanıcı Yönetimi',
      items: [
        { name: 'Kullanıcılar', href: '/admin/users', icon: Users },
      ]
    },
    {
      name: 'Güvenlik & Moderasyon',
      items: [
        { name: 'Şikayetler', href: '/admin/reports', icon: Flag, badge: reportedContentCount },
        { name: 'Güvenlik Logları', href: '/admin/security', icon: Shield },
      ]
    },
    {
      name: 'Topluluk',
      items: [
        { name: 'Sosyal Medya', href: '/admin/community-accounts', icon: Share2 },
      ]
    },
    {
      name: 'Analitik & Raporlar',
      items: [
        { name: 'İstatistikler', href: '/admin/stats', icon: BarChart3 },
        { name: 'Site Trafiği', href: '/admin/analytics', icon: Globe },
      ]
    },
    {
      name: 'Sistem',
      items: [
        { name: 'Sistem Ayarları', href: '/admin/settings', icon: Settings },
      ]
    }
  ];

  const isActive = (href: string) => {
    return href === '/admin' ? pathname === href : pathname.startsWith(href);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 z-30 bg-gray-900/60 backdrop-blur-sm"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 bg-gray-900 text-gray-300 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobile ? 'w-72' : 'w-64'}
        ${isCollapsed && isMobile ? '-translate-x-full' : 'translate-x-0'}
      `}>
        
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <h1 className="text-lg font-bold text-white">Admin Paneli</h1>
          </div>
          {isMobile && (
            <button onClick={() => setIsCollapsed(true)} className="p-1 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Admin" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-gray-300">
                    {getInitials(user?.displayName || user?.email || 'A')}
                  </span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.displayName || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
          {navCategories.map((category) => (
            <div key={category.name} className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                {category.name}
              </h3>
              <div className="space-y-1">
                {category.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => isMobile && setIsCollapsed(true)}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200
                        ${active 
                          ? 'bg-blue-600/90 text-white shadow-lg' 
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }
                      `}
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <span className={`
                          ml-auto text-xs font-bold px-2 py-0.5 rounded-full
                          ${active ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
           <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Siteye Dön</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {isMobile && (
        <button
          onClick={() => setIsCollapsed(false)}
          className={`
            fixed top-4 left-4 z-20 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-opacity duration-300
            ${!isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
        >
          <Menu size={22} className="text-gray-800" />
        </button>
      )}
    </>
  );
}