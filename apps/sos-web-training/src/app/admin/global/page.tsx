'use client';

import { Suspense } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PagesTab, PostsTab } from '@/components/admin/settings/cms';
import { Card, CardBody, Tabs, Tab } from '@heroui/react';
import { SubscriptionTab } from '@/components/admin/subscription/SubscriptionTab';
import { PaymentList } from '@/components/admin/settings/payment';
import { GlobalSettingsTab } from '../../../components/admin/settings/global-settings';

const breadcrumbs = [{ label: 'Dashboard', href: '/admin' }, { label: 'Global Settings' }];

function GlobalPageContent() {
  return (
    <PageWrapper title="Global Settings" breadcrumbs={breadcrumbs}>
      <Card className="bg-backgroundSecondary border border-border">
        <CardBody>
          <Tabs
            // isVertical={isMobile}
            classNames={{ 
              tabContent: 'text-text group-data-[selected=true]:text-white',
              panel: 'overflow-x-auto'
            }}
            variant="bordered"
            color="primary"
          >
            <Tab key="global-settings" title="Global Settings">
              <GlobalSettingsTab />
            </Tab>
            <Tab key="pages" title="Pages">
              <PagesTab />
            </Tab>
            <Tab key="posts" title="Posts">
              <PostsTab />
            </Tab>
            <Tab key="subscription" title="Subscription">
              <SubscriptionTab />
            </Tab>
            <Tab key="payment" title="Payment">
              <PaymentList />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}

export default function GlobalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <GlobalPageContent />
    </Suspense>
  );
}
