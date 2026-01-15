'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import {
  Listbox,
  ListboxSection,
  ListboxItem,
  Avatar,
  Tooltip,
  cn,
  Link,
  Button,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/api/useTranslation';

// Icon components
const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    className={cn('w-5 h-5 transition-transform duration-300', collapsed ? 'rotate-180' : '')}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface MenuItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
  children?: MenuItem[];
  roles?: readonly string[];
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  menuItems?: MenuItem[];
  user?: User;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  variant?: 'default' | 'modern' | 'minimal';
  showUserSection?: boolean;
  brand?: {
    logo?: string;
    logoAlt?: string;
    text?: string;
    tagline?: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

const SidebarComponent = forwardRef<HTMLElement, SidebarProps>(
  (
    {
      menuItems = [],
      user,
      collapsed = false,
      onToggleCollapse,
      variant = 'modern',
      showUserSection = true,
      brand,
      className,
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation();
    // Removed theme utilities - using static values
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<string>('Dashboard');
    const router = useRouter();

    useEffect(() => {
      setSelectedItems(
        menuItems.filter((item) => item.active).map((item) => item.label)[0] || 'Dashboard',
      );
    }, [menuItems]);

    const getUserInitials = (user: User) => {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    };

    // Handle menu item click
    const handleItemClick = (item: MenuItem, event: React.MouseEvent) => {
      if (item.onClick) {
        event.preventDefault();
        item.onClick();
      }
    };

    // Render menu item
    const renderMenuItem = (item: MenuItem, level = 0) => {
      const isHovered = hoveredItem === item.href || hoveredItem === item.label;
      // Determine if this item is selected (active)
      const isActive = !!item.active;

      return (
        <ListboxItem
          key={item.label}
          textValue={item.label}
          className={cn(
            'group relative cursor-pointer border-l-4 border-[#9333ea] rounded-md transform-2',
            level > 0 && 'ml-6',
          )}
          onMouseEnter={() => setHoveredItem(item.label)}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            padding: '0.5rem',
            backgroundColor: isActive
              ? 'var(--color-primaryActive)'
              : isHovered
                ? 'var(--color-secondaryHover)'
                : 'var(--color-backgroundSecondary)',
            borderRadius: '0.5rem',
          }}
          aria-current={isActive ? 'true' : undefined}
        >
          {item.href ? (
            <Link
              href={item.href}
              onClick={(e) => handleItemClick(item, e)}
              className={cn(
                'flex items-center justify-between w-full',
                isActive && 'font-medium',
                isHovered && 'text-text',
              )}
              aria-current={isActive ? 'true' : undefined}
              aria-label={`${item.label}${item.badge ? ` (${item.badge} notifications)` : ''}`}
            >
              {collapsed ? (
                <Tooltip
                  content={
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
                      <span className="font-medium text-text">{item.label}</span>
                      {item.badge && (
                        <div
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning text-text`}
                        >
                          {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                        </div>
                      )}
                    </div>
                  }
                  placement="right"
                  showArrow
                  className="bg-background border border-border"
                >
                  <div className="flex items-center justify-center w-full h-8">{item.icon}</div>
                </Tooltip>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-1 min-w-0 h-8">
                    {item.icon && <div className="flex-shrink-0">{item.icon}</div>}
                    <span className={cn('truncate text-sm font-medium', isActive && 'text-white')}>
                      {item.label}
                    </span>
                  </div>
                  {item.badge && (
                    <div
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning text-surface`}
                    >
                      {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </>
              )}
            </Link>
          ) : (
            <div
              onClick={(e) => handleItemClick(item, e)}
              className={cn('flex items-center justify-between w-full', isActive && 'font-medium')}
              aria-current={isActive ? 'true' : undefined}
              aria-label={`${item.label}${item.badge ? ` (${item.badge} notifications)` : ''}`}
            >
              {collapsed ? (
                <Tooltip
                  content={
                    <div className="flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge && (
                        <div
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning text-surface`}
                        >
                          {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                        </div>
                      )}
                    </div>
                  }
                  placement="right"
                  showArrow
                  className="bg-background border border-border"
                >
                  <div className="flex items-center justify-center w-full h-8">{item.icon}</div>
                </Tooltip>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-1 min-w-0 h-8">
                    {item.icon && <div className="flex-shrink-0">{item.icon}</div>}
                    <span className={cn('truncate text-sm font-medium', isActive && 'text-white')}>
                      {item.label}
                    </span>
                  </div>
                  {item.badge && (
                    <div
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning text-surface`}
                    >
                      {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!collapsed && item.children && item.children.length > 0 && (
            <div className="mt-1 space-y-1">
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </ListboxItem>
      );
    };

    return (
      <aside
        ref={ref}
        className={cn(
          'h-full flex flex-col',
          variant === 'modern' && 'bg-background',
          variant === 'minimal' && 'bg-background backdrop-blur-sm',
          collapsed ? 'w-16' : 'w-64',
          className,
        )}
        {...props}
      >
        <div className="flex-1 overflow-y-auto">
          <Listbox aria-label="Sidebar" selectedKeys={selectedItems}>
            <ListboxSection
              classNames={{
                group: 'space-y-1',
              }}
            >
              {menuItems.map((item) => renderMenuItem(item))}
            </ListboxSection>
          </Listbox>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'w-full flex justify-between items-center p-4 font-medium text-sm text-text transition-colors hover:bg-surfaceHover focus:outline-none',
              collapsed && 'justify-center',
            )}
            aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            {!collapsed && <span>{t('sidebar.collapse')}</span>}
            <CollapseIcon collapsed={collapsed} />
          </button>
        )}

        {showUserSection && user && (
          <div className="border-t border-divider">
            <div
              className={`py-4 flex items-center ${collapsed ? 'justify-center' : 'justify-start px-4'}`}
            >
              {!collapsed ? (
                <Button
                  variant="light"
                  className="flex items-center p-0 gap-3 w-full data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[focus=true]:bg-transparent data-[active=true]:bg-transparent data-[selected=true]:bg-transparent"
                  onPress={() => router.push('/my-account')}
                >
                  {/* User Avatar */}
                  <Avatar
                    name={getUserInitials(user)}
                    size="md"
                    className="flex-shrink-0 bg-background border-2 border-primary text-primary"
                    showFallback
                  />

                  {/* User Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-text truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-textMuted capitalize truncate">
                      {user.role.replaceAll('_', ' ')}
                    </p>
                  </div>
                </Button>
              ) : (
                <Tooltip
                  content={
                    <div className="flex flex-col gap-2 px-3 py-2 rounded-lg">
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <p className="text-xs capitalize">{user.role.replaceAll('_', '')}</p>
                    </div>
                  }
                  placement="right"
                  showArrow
                  className="bg-background border border-border"
                >
                  <Button
                    variant="light"
                    className="rounded-full"
                    isIconOnly
                    onPress={() => {
                      router.push('/my-account');
                    }}
                  >
                    <Avatar
                      name={getUserInitials(user)}
                      size="md"
                      className="flex-shrink-0 bg-background border-2 border-primary text-primary"
                      showFallback
                    />
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </aside>
    );
  },
);

SidebarComponent.displayName = 'SidebarComponent';

// Mobile overlay variant
interface MobileSidebarOverlayProps extends SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebarOverlay: React.FC<MobileSidebarOverlayProps> = ({
  isOpen,
  onClose,
  ...sidebarProps
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <SidebarComponent {...sidebarProps} collapsed={false} className="h-full" />
    </div>
  );
};

// Main export
export const Sidebar = SidebarComponent;
