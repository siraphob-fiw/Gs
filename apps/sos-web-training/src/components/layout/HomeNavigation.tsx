'use client';

import React from 'react';
import {
  Navbar,
  Button,
  NavbarBrand,
  NavbarContent,
  Link,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Spinner,
} from '@heroui/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useIsMobile, useIsTablet } from '@/hooks/api/use-screen-utils';
import { RxHamburgerMenu } from 'react-icons/rx';
import { PageStatus, usePages, Page } from '@/hooks/api/use-cms';

interface HomeNavigationProps {
  redirectUrl: { url: string; label: string } | null;
}

export const HomeNavigation = ({ redirectUrl }: HomeNavigationProps) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { data: pages, isLoading: isPagesLoading } = usePages({ status: PageStatus.PUBLISHED });

  const homePageMenu = [
    {
      label: 'Home',
      href: '/',
    },
    ...(pages?.data
      ?.filter((page: Page) => page.options?.on_menu)
      .map((page: Page) => ({
        label: page.title,
        href: '/content/' + page.slug,
      })) || []),
  ];

  const HamburgerMenu = () => {
    return (
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
          <DropdownSection>
            <>
              {homePageMenu.map((item) => (
                <DropdownItem key={item.href} href={item.href}>
                  {item.label}
                </DropdownItem>
              ))}
              {isMobile && redirectUrl && (
                <DropdownItem
                  key={'action'}
                  className="bg-primary text-white hover:bg-primaryHover"
                  onPress={() => router.push(redirectUrl.url)}
                >
                  {redirectUrl.label}
                </DropdownItem>
              )}
            </>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
    );
  };

  if (isPagesLoading) {
    return (
      <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center z-50 bg-background">
        <Image
          src="/images/logos/humansOS.svg"
          alt="StrengthOS Logo"
          className="shadow-lg rounded-lg border border-border mb-6"
          width={80}
          height={80}
          priority
        />
        <Spinner size="lg" color="primary" />
        <span className="text-textMuted font-medium mt-4">Loading...</span>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 max-w-7xl w-[calc(100%-2rem)] mx-auto px-4 py-2 border rounded-lg shadow-lg z-50 bg-background/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/images/logos/humansOS.svg"
            alt="StrengthOS Logo"
            className="shadow-lg rounded-lg border border-border"
            width={48}
            height={48}
            priority
          />
          <span className="ml-2 font-semibold text-lg">StrengthOS Training</span>
        </div>
        <HamburgerMenu />
      </div>
    );
  }

  return (
    <Navbar
      maxWidth="xl"
      classNames={{
        base: 'px-4 fixed top-2 left-1/2 -translate-x-1/2 max-w-7xl w-[calc(100%-2rem)] mx-auto bg-background border-2 rounded-lg shadow-lg z-50',
        wrapper: `${isTablet ? 'px-4' : 'px-0'}`,
        brand: 'flex items-center gap-2 p-0',
      }}
    >
      <NavbarBrand>
        <Image
          src="/images/logos/humansOS.svg"
          alt="StrengthOS Logo"
          className="shadow-lg rounded-lg border border-border"
          width={48}
          height={48}
          priority
        />
        <span className="ml-2 font-semibold text-lg">StrengthOS Training</span>
      </NavbarBrand>
      {!isTablet ? (
        <NavbarContent className="gap-x-0" justify="center">
          {homePageMenu.map((item) => (
            <NavbarItem key={item.href}>
              <Link href={item.href} className="font-medium text-text px-3 py-2 rounded transition">
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      ) : (
        <NavbarContent justify="center">
          <HamburgerMenu />
        </NavbarContent>
      )}
      <NavbarContent justify="center">
        <NavbarItem>
          <Button
            color="default"
            variant="solid"
            onPress={() => router.push(redirectUrl?.url || '/login')}
            className="font-medium px-4 py-2 rounded shadow"
          >
            {redirectUrl?.label}
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};
