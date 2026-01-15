'use client';

import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from '@heroui/react';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  actions?: React.ReactNode;
}

export const PageWrapper = ({ children, title, breadcrumbs = [], actions }: PageWrapperProps) => {
  return (
    <div className="space-y-6">
      {breadcrumbs.length > 0 && (
        <Breadcrumbs>
          {breadcrumbs.map((breadcrumb) => (
            <BreadcrumbItem
              classNames={{ item: 'text-text', separator: 'text-textSecondary' }}
              key={breadcrumb.label}
              href={breadcrumb.href}
            >
              {breadcrumb.label}
            </BreadcrumbItem>
          ))}
        </Breadcrumbs>
      )}

      {/* Page Header */}
      {(title || actions) && (
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
          {title && <h1 className="text-2xl font-semibold text-text line-clamp-1">{title}</h1>}
          {actions && <div className="flex gap-2 justify-end">{actions}</div>}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
};
