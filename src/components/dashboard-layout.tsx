'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Car, Clipboard, Building, Users, Search, Download } from 'lucide-react';
import Switch from '@/components/ui/switch';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState('user@example.com');

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'daily-cleans', label: 'Daily Cleans', icon: Car, href: '/dashboard/daily-cleans' },
    { id: 'sales-prep', label: 'Sales Prep', icon: Clipboard, href: '/dashboard/sales-prep' },
    { id: 'branches', label: 'Branches', icon: Building, href: '/dashboard/branches' },
    { id: 'users', label: 'Users', icon: Users, href: '/dashboard/users' },
    { id: 'search', label: 'Search', icon: Search, href: '/dashboard/search' },
    { id: 'export', label: 'Export', icon: Download, href: '/dashboard/export' },
  ];

  // Get active section from pathname
  const activeSection = pathname === '/dashboard' ? 'overview' : pathname.split('/').pop() || 'overview';

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    // Load user email (mock for now)
    setUserEmail('admin@example.com');
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  const handleLogout = () => {
    // Mock logout - in real app, this would clear auth state
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 lg:w-16
        bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-[#262626]
        transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center p-4 lg:p-3 border-b border-gray-200 dark:border-[#262626]">
            <div className="flex items-center justify-center">
              <i className="fas fa-shield-alt text-green-500 text-xl"></i>
              <span className="text-lg font-semibold text-gray-900 dark:text-[#fafafa] lg:hidden ml-3">Admin Dashboard</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#262626] absolute right-4"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-[#a1a1a1]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 lg:p-3">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        router.push(item.href);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium
                        transition-colors duration-200
                        ${isActive
                          ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-[#262626] dark:text-[#fafafa] dark:border-[#525252]'
                          : 'text-gray-700 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#262626]'
                        }
                        lg:justify-center lg:space-x-0
                      `}
                      title={item.label} // Tooltip for desktop
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="lg:hidden">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-md bg-white dark:bg-[#0a0a0a] shadow-md border border-gray-200 dark:border-[#262626]"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-[#a1a1a1]" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="bg-white dark:bg-[#0a0a0a] shadow-sm border-b border-gray-200 dark:border-[#262626] px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-semibold text-gray-900 dark:text-[#fafafa]">
                Admin Dashboard {activeSection === 'daily-cleans' && '| Daily Cleans'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-[#a1a1a1]">{userEmail}</span>
              <div className="flex items-center mx-2" title="Toggle Theme">
                {mounted && (
                   <Switch 
                    checked={theme === 'dark'} 
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
                  />
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#262626] rounded text-gray-600 dark:text-[#a1a1a1]"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </button>
            </div>
          </div>
        </nav>
        <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#0a0a0a]">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
