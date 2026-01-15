'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  Navbar,
  Button,
  NavbarBrand,
  NavbarContent,
  Link,
  cn,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from '@heroui/react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@strengthos/shared-types';
import { adaptUserForUI } from '@/utils/user-adapter';
import { ConfirmationModal } from '../forms/ConfirmationModal';
import { RxHamburgerMenu } from 'react-icons/rx';
import { FaCalendar, FaCogs, FaRunning, FaTrophy, FaWrench } from 'react-icons/fa';
import { EnhancedColorSwitcher } from './EnhancedColorSwitcher';
import { IoIosLogOut } from 'react-icons/io';
import Image from 'next/image';
import { useTranslation } from '@/hooks/api/useTranslation';
import { FaUser } from 'react-icons/fa6';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { UserResponse } from '@/hooks/api/use-users';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Icon components for navigation
const DashboardIcon = ({ strokeColor }: { strokeColor?: string } = {}) => (
  <svg className="w-5 h-5" fill="none" stroke={strokeColor || 'currentColor'} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
    />
  </svg>
);

const WorkoutIcon = ({ strokeColor }: { strokeColor?: string } = {}) => (
  <svg className="w-5 h-5" fill="none" stroke={strokeColor || 'currentColor'} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const ExerciseIcon = ({ strokeColor }: { strokeColor?: string } = {}) => (
  <svg className="w-5 h-5" fill="none" stroke={strokeColor || 'currentColor'} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { state, logout } = useAuth();
  const { isLoading } = state;
  const user = state.user;
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const { t } = useTranslation();
  const { isAdmin } = useRoleAccess();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = useCallback(async () => {
    if (state.isLoggingOut) {
      return;
    }

    await logout();
  }, [state.isLoggingOut, logout]);

  // Memoize navigation items to prevent recreation on every render
  const navigationItems = useMemo(() => {
    const isAthleteOrSelfCoached = [UserRole.ATHLETE, UserRole.SELF_COACHED].includes(
      user?.role as UserRole,
    );
    if (!user?.tenantId && !isAdmin()) {
      return [
        {
          label: t('dashboard'),
          href: '/dashboard',
          icon: <DashboardIcon strokeColor={pathname === '/dashboard' ? 'white' : undefined} />,
          active: pathname === '/dashboard',
          roles: [UserRole.ATHLETE, UserRole.SELF_COACHED, UserRole.COACH],
        },
        {
          label: t('user.profile'),
          href: '/my-account',
          icon: (
            <FaUser
              className={pathname.startsWith('/my-account') ? 'text-white' : 'text-primary'}
            />
          ),
          active: pathname.startsWith('/my-account'),
        },
      ];
    }

    return [
      {
        label: t('dashboard'),
        href: '/dashboard',
        icon: <DashboardIcon strokeColor={pathname === '/dashboard' ? 'white' : undefined} />,
        active: pathname === '/dashboard',
        roles: [UserRole.ATHLETE, UserRole.SELF_COACHED, UserRole.COACH],
      },
      {
        label: t('adminDashboard'),
        href: '/admin',
        icon: <DashboardIcon strokeColor={pathname === '/admin' ? 'white' : undefined} />,
        active: pathname === '/admin',
        roles: [UserRole.COACH_ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN],
      },
      {
        label: t('common.tabs.globalSettings'),
        href: '/admin/global',
        icon: <FaCogs className={pathname === '/admin/global' ? 'text-white' : 'text-primary'} />,
        active: pathname === '/admin/global',
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: t('common.tabs.tenantSettings'),
        href: '/admin/tenants',
        icon: <FaCogs className={pathname === '/admin/tenants' ? 'text-white' : 'text-primary'} />,
        active: pathname === '/admin/tenants',
        roles: [UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN],
      },
      {
        label: t('common.tabs.tenantUsers'),
        href: '/admin/users',
        icon: <FaUser className={pathname === '/admin/users' ? 'text-white' : 'text-primary'} />,
        active: pathname === '/admin/users',
        roles: [UserRole.COACH_ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN],
      },
      {
        label: t('common.tabs.athleteManage', { defaultValue: 'Athletes management' }),
        href: '/manage/coach-athletes',
        icon: <FaUser className={pathname === '/manage/coach-athletes' ? 'text-white' : 'text-primary'} />,
        active: pathname === '/manage/coach-athletes',
        roles: [UserRole.COACH],
      },
      {
        label: t('manageWorkouts'),
        href: '/workout/manage-workouts',
        icon: (
          <WorkoutIcon
            strokeColor={pathname.startsWith('/workout/manage-workouts') ? 'white' : undefined}
          />
        ),
        active: pathname.startsWith('/workout/manage-workouts'),
        roles: [UserRole.COACH, UserRole.COACH_ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN],
      },
      {
        label: t('calendarTrainingSession'),
        href: '/workout/calendar-session',
        icon: (
          <FaCalendar
            className={
              pathname.startsWith('/workout/calendar-session') ? 'text-white' : 'text-primary'
            }
          />
        ),
        active: pathname.startsWith('/workout/calendar-session'),
        roles: [UserRole.ATHLETE, UserRole.SELF_COACHED],
      },
      {
        label: isAthleteOrSelfCoached ? t('myWorkouts') : t('athleteWorkouts'),
        href: '/workout/session',
        icon: (
          <FaRunning
            className={pathname.startsWith('/workout/session') ? 'text-white' : 'text-primary'}
          />
        ),
        active: pathname.startsWith('/workout/session'),
      },
      {
        label: t('progression'),
        href: '/progression',
        icon: (
          <FaTrophy
            className={pathname.startsWith('/progression') ? 'text-white' : 'text-primary'}
          />
        ),
        active: pathname.startsWith('/progression'),
      },
      {
        label: isAdmin() ? t('manageExercises') : t('Exercises'),
        href: '/manage/exercises',
        icon: (
          <ExerciseIcon
            strokeColor={pathname.startsWith('/manage/exercises') ? 'white' : undefined}
          />
        ),
        active: pathname.startsWith('/manage/exercises'),
        roles: [UserRole.COACH, UserRole.COACH_ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN],
      },
      {
        label: isAdmin() ? t('manageModifiers') : t('Modifiers'),
        href: '/manage/modifier',
        icon: (
          <FaWrench
            className={pathname.startsWith('/manage/modifier') ? 'text-white' : 'text-primary'}
          />
        ),
        active: pathname.startsWith('/manage/modifier'),
        roles: [UserRole.COACH, UserRole.COACH_ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN],
      },
      {
        label: t('user.profile'),
        href: '/my-account',
        icon: (
          <FaUser className={pathname.startsWith('/my-account') ? 'text-white' : 'text-primary'} />
        ),
        active: pathname.startsWith('/my-account'),
      },
    ];
  }, [user, isAdmin, t, pathname]);

  // Memoize filtered nav items
  const filteredNavItems = useMemo(() => {
    return navigationItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return user && item.roles.includes(user?.role as UserRole);
    });
  }, [navigationItems, user]);

  // Memoize user info to prevent unnecessary recalculations
  const adaptedUser = useMemo(() => user ? adaptUserForUI({
    id: user.id,
    tenantId: user.tenantId,
    tenantName: user.tenantName,
    email: user.email,
    role: user.role,
  } as UserResponse) : null, [user]);
  const userDisplayName = useMemo(() => {
    return adaptedUser ? `${adaptedUser.firstName} ${adaptedUser.lastName}` : '';
  }, [adaptedUser]);
  const userRoleDisplay = useMemo(() => {
    return adaptedUser?.role?.replaceAll('_', ' ') || '';
  }, [adaptedUser]);

  // Memoize navbar actions to prevent recreation on every render
  const NavbarActions = useMemo(
    () => (
      <div className="flex items-center space-x-3">
        <div className="flex gap-4 items-center lg:hidden">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm text-text">{userDisplayName}</span>
            <span className="text-sm text-textSecondary capitalize">{userRoleDisplay}</span>
          </div>
          {/* {user?.role === UserRole.SUPER_ADMIN && <TenantSwitcher />} */}
          <EnhancedColorSwitcher />
          <Dropdown
            classNames={{
              content: `text-text bg-background border border-border`,
            }}
          >
            <DropdownTrigger>
              <Button variant="light" size="sm" isIconOnly>
                <RxHamburgerMenu className="w-6 h-6 text-text" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu disabledKeys={['user-info']}>
              <DropdownSection title={t('userInfo')} className="md:hidden">
                <DropdownItem key={'user-info'} className="md:hidden opacity-100">
                  <p className="text-sm text-text">{userDisplayName}</p>
                  <p className="text-sm text-textSecondary capitalize">{userRoleDisplay}</p>
                </DropdownItem>
              </DropdownSection>
              <DropdownSection title={t('navigation')}>
                <>
                  {filteredNavItems.map((item) => (
                    <DropdownItem key={item.href} href={item.href}>
                      {item.label}
                    </DropdownItem>
                  ))}
                  <DropdownItem
                    className="text-error data-[hover=true]:bg-error data-[hover=true]:text-white"
                    key={'logout'}
                    onPress={() => setIsConfirmDialogOpen(true)}
                  >
                    {t('logout')}
                  </DropdownItem>
                </>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          {/* {user?.role === UserRole.SUPER_ADMIN && <TenantSwitcher />} */}
          <EnhancedColorSwitcher />
          <Button
            variant="bordered"
            size="sm"
            onPress={() => setIsConfirmDialogOpen(true)}
            isLoading={state.isLoggingOut}
            isDisabled={state.isLoggingOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-errorHover bg-error text-surface hover:bg-errorHover hover:border-error transition-colors duration-150 shadow-sm"
            style={{
              minWidth: 90,
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            {!state.isLoggingOut && (
              <span className="flex items-center">
                <IoIosLogOut className="w-5 h-5 text-surface" />
              </span>
            )}
            <span className="hidden md:inline">
              {state.isLoggingOut ? t('loggingOut') : t('logout')}
            </span>
          </Button>
        </div>
      </div>
    ),
    [filteredNavItems, userDisplayName, userRoleDisplay, state.isLoggingOut, t],
  );

  // Memoize variant classes
  const variantClasses = useMemo(
    () => ({
      default: cn('border-b border-border'),
      transparent: cn('backdrop-blur-md border-b border-border'),
      gradient: cn('bg-gradient-to-r border-b border-border'),
    }),
    [],
  );

  // Memoize dashboard href
  const dashboardHref = useMemo(() => {
    return isAdmin() ? '/admin' : '/dashboard';
  }, [isAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-32 w-32 border-b-2 border-current mx-auto"
            style={{ borderColor: 'var(--color-primary)' }}
          ></div>
          <p className="mt-4 text-lg">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col app-layout-container`}>
      <Navbar
        maxWidth="full"
        position="sticky"
        className={`navbar-container transition-all duration-300 h-16 bg-background ${variantClasses['default']}`}
      >
        <NavbarBrand className="flex items-center gap-2">
          <Link href={dashboardHref} className="w-auto relative flex items-center">
            <div className="h-12">
              <Image
                src="/images/logos/humansOS.svg"
                alt={t('logo')}
                width={120}
                height={50}
                className="object-contain rounded"
                priority
                style={{ width: 'auto', height: '100%' }}
              />
            </div>
          </Link>
          {user?.role !== UserRole.SUPER_ADMIN ? (
            <span className="font-medium">{user?.tenantName ?? t('strengthOSTraining')}</span>
          ) : (
            <span className="font-medium">{t('strengthOSTraining')}</span>
          )}
        </NavbarBrand>
        <NavbarContent justify="end" className="flex items-center gap-2">
          {NavbarActions}
        </NavbarContent>
      </Navbar>

      <main className="relative flex flex-grow boackgroud-secondary">
        <aside className="sidebar-container hidden lg:flex">
          <Sidebar
            menuItems={filteredNavItems}
            user={user ?? undefined}
            showUserSection
            variant="default"
            collapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="sticky top-0 h-screen -mt-16 pt-[70px] transition-all duration-300 shadow-xl backdrop-blur-sm border-r border-border"
          />
        </aside>
        <section className="flex-1 relative mx-auto transition-all duration-300 p-4 pb-24 overflow-x-auto">
          {children}
        </section>
      </main>

      <ConfirmationModal
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
        }}
        onConfirm={() => {
          handleLogout();
          setIsConfirmDialogOpen(false);
        }}
        title={t('confirmation')}
        message={t('areYouSureYouWantToDoThis')}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
      />
    </div>
  );
};
