'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success',
  PENDING: 'bg-warning',
  INACTIVE: 'bg-secondary',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const bgClass = STATUS_STYLES[status] ?? 'bg-secondary';
  const displayText = status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span
      className={`inline-block px-2 py-1 text-xs rounded-full font-medium text-white ${bgClass}`}
    >
      {displayText}
    </span>
  );
}
