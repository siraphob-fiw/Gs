import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-semibold text-textSecondary mb-4">404</h1>
        <h2 className="text-2xl font-medium text-textMuted mb-4">Page Not Found</h2>
        <p className="text-textMuted mb-8">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-info hover:bg-infoHover text-text font-medium py-3 px-6 rounded-md transition-colors duration-200"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
