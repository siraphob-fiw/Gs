'use client';

import { useEffect, useState, Suspense } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { HomeLayout } from '@/components/layout/homeLayout';
import { usePage } from '@/hooks/api/use-cms';
import { PageRenderer } from '@/components/admin/PageBuilder/PageRenderer';

function DynamicPageContent() {
  const params = useParams();
  const slug = params?.slug ?? null;

  const [notFoundState, setNotFoundState] = useState(false);

  const { data, isLoading, error } = slug
    ? usePage(slug as string)
    : { data: null, isLoading: false, error: null };

  useEffect(() => {
    if (!isLoading && (!data || error)) {
      setNotFoundState(true);
    }
  }, [data, isLoading, error]);

  if (!slug || slug === null) {
    return notFound();
  }

  if (notFoundState) {
    notFound();
  }

  if (isLoading) {
    return (
      <HomeLayout>
        <div className="flex justify-center items-center min-h-[300px]">
          <Spinner size="lg" color="primary" />
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className={`container mx-auto pt-[80px] px-4 pb-8`}>
        <h1 className="text-3xl md:text-4xl font-bold my-8 text-primary-700">{data?.title}</h1>
        <PageRenderer content={data?.content || ''} />
      </div>
    </HomeLayout>
  );
}

export default function DynamicPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <DynamicPageContent />
    </Suspense>
  );
}
