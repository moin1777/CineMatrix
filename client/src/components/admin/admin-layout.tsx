'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

// ============================================================================
// ICONS (Using inline SVGs for consistency)
// ============================================================================

const Icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  venue: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  movie: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  pricing: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  analytics: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  boxOffice: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  chevronRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  bell: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin',
    icon: Icons.dashboard,
  },
  {
    id: 'venues',
    label: 'Venues & Inventory',
    href: '/admin/venues',
    icon: Icons.venue,
    children: [
      { id: 'venues-list', label: 'All Venues', href: '/admin/venues', icon: Icons.venue },
      { id: 'venues-create', label: 'Create Venue', href: '/admin/venues/create', icon: Icons.venue },
      { id: 'seat-builder', label: 'Seat Map Builder', href: '/admin/venues/seat-builder', icon: Icons.venue },
      { id: 'templates', label: 'Layout Templates', href: '/admin/venues/templates', icon: Icons.venue },
    ],
  },
  {
    id: 'shows',
    label: 'Shows & Scheduling',
    href: '/admin/shows',
    icon: Icons.calendar,
    children: [
      { id: 'shows-list', label: 'All Shows', href: '/admin/shows', icon: Icons.calendar },
      { id: 'shows-create', label: 'Schedule Show', href: '/admin/shows/create', icon: Icons.calendar },
      { id: 'shows-calendar', label: 'Calendar View', href: '/admin/shows/calendar', icon: Icons.calendar },
    ],
  },
  {
    id: 'movies',
    label: 'Movies & Events',
    href: '/admin/movies',
    icon: Icons.movie,
    children: [
      { id: 'movies-list', label: 'All Movies', href: '/admin/movies', icon: Icons.movie },
      { id: 'movies-create', label: 'Add Movie', href: '/admin/movies/create', icon: Icons.movie },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing Engine',
    href: '/admin/pricing',
    icon: Icons.pricing,
    children: [
      { id: 'pricing-rules', label: 'Pricing Rules', href: '/admin/pricing', icon: Icons.pricing },
      { id: 'pricing-dynamic', label: 'Dynamic Pricing', href: '/admin/pricing/dynamic', icon: Icons.pricing },
      { id: 'pricing-promotions', label: 'Promotions', href: '/admin/pricing/promotions', icon: Icons.pricing },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/admin/analytics',
    icon: Icons.analytics,
    children: [
      { id: 'analytics-overview', label: 'Overview', href: '/admin/analytics', icon: Icons.analytics },
      { id: 'analytics-revenue', label: 'Revenue', href: '/admin/analytics/revenue', icon: Icons.analytics },
      { id: 'analytics-occupancy', label: 'Occupancy Heatmaps', href: '/admin/analytics/occupancy', icon: Icons.analytics },
      { id: 'analytics-reports', label: 'Reports', href: '/admin/analytics/reports', icon: Icons.analytics },
    ],
  },
  {
    id: 'box-office',
    label: 'Box Office',
    href: '/admin/box-office',
    icon: Icons.boxOffice,
    badge: 3,
  },
  {
    id: 'users',
    label: 'User Management',
    href: '/admin/users',
    icon: Icons.users,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    icon: Icons.settings,
  },
];

// ============================================================================
// SIDEBAR NAV ITEM COMPONENT
// ============================================================================

interface SidebarNavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  currentPath: string;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ item, isCollapsed, currentPath }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = currentPath === item.href || 
    (hasChildren && item.children?.some(child => currentPath === child.href));

  const toggleExpand = useCallback(() => {
    if (hasChildren) {
      setIsExpanded(prev => !prev);
    }
  }, [hasChildren]);

  // Auto-expand if a child is active
  React.useEffect(() => {
    if (hasChildren && item.children?.some(child => currentPath === child.href)) {
      setIsExpanded(true);
    }
  }, [currentPath, hasChildren, item.children]);

  if (isCollapsed) {
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center justify-center p-3 rounded-lg transition-colors relative group',
          isActive
            ? 'bg-primary-500/20 text-primary-400'
            : 'text-gray-400 hover:bg-surface-active hover:text-white'
        )}
        title={item.label}
      >
        {item.icon}
        {item.badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {item.badge}
          </span>
        )}
        {/* Tooltip */}
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
          {item.label}
        </div>
      </Link>
    );
  }

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={toggleExpand}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
            isActive
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-gray-400 hover:bg-surface-active hover:text-white'
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </div>
          <span className={cn('transition-transform', isExpanded && 'rotate-180')}>
            {Icons.chevronDown}
          </span>
        </button>
      ) : (
        <Link
          href={item.href}
          className={cn(
            'flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
            isActive
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-gray-400 hover:bg-surface-active hover:text-white'
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </div>
          {item.badge && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
      )}

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
          {item.children!.map(child => (
            <Link
              key={child.id}
              href={child.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                currentPath === child.href
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-gray-500 hover:bg-surface-active hover:text-white'
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentPath: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse, currentPath }) => {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-surface-card border-r border-gray-800 transition-all duration-300 z-40',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center border-b border-gray-800 px-4',
        isCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!isCollapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="text-white font-semibold">Cinematrix</span>
          </Link>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-surface-active text-gray-400 hover:text-white transition-colors"
        >
          {isCollapsed ? Icons.chevronRight : Icons.close}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-4rem)]">
        {navItems.map(item => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            currentPath={currentPath}
          />
        ))}
      </nav>
    </aside>
  );
};

// ============================================================================
// HEADER COMPONENT
// ============================================================================

interface HeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, sidebarCollapsed }) => {
  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-surface-card border-b border-gray-800 flex items-center justify-between px-6 z-30 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      {/* Left side - Mobile menu & Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-surface-active text-gray-400"
        >
          {Icons.menu}
        </button>

        {/* Search */}
        <div className="relative hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {Icons.search}
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 bg-surface-active rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Right side - Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-surface-active text-gray-400 hover:text-white transition-colors">
          {Icons.bell}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-active transition-colors">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">AD</span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </button>
      </div>
    </header>
  );
};

// ============================================================================
// MOBILE SIDEBAR OVERLAY
// ============================================================================

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose, currentPath }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-card border-r border-gray-800 z-50 lg:hidden">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between border-b border-gray-800 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="text-white font-semibold">Cinematrix</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-active text-gray-400"
          >
            {Icons.close}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-4rem)]">
          {navItems.map(item => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isCollapsed={false}
              currentPath={currentPath}
            />
          ))}
        </nav>
      </aside>
    </>
  );
};

// ============================================================================
// MAIN ADMIN LAYOUT COMPONENT
// ============================================================================

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-surface-default">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          currentPath={pathname}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        currentPath={pathname}
      />

      {/* Header */}
      <Header
        onMenuClick={toggleMobileSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
