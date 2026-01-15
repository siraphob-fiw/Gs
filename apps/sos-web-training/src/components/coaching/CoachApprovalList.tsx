'use client';

import React, { useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Accordion,
  AccordionItem,
  Button,
  Spinner,
  addToast,
} from '@heroui/react';
import { UserStatus } from '@strengthos/shared-types';
import { useApprovalCoachList } from '@/hooks/api/use-users';
import { useAuth } from '@/hooks/api/use-auth-hooks';
import { proxyClient } from '@/lib/proxy-client';

export function CoachApprovalList() {
  const { state } = useAuth();
  const user = state.user;
  const { data: pendingApprovals, isLoading, refetch } = useApprovalCoachList();

  const handleUpdateCoachStatus = useCallback(
    async (coachId: string, status: UserStatus) => {
      if (!user?.tenantId) return;
      try {
        const payload = {
          status: status,
        };
        await proxyClient.put(`/users/${coachId}`, payload);
        addToast({
          title: 'Coach status updated successfully',
          variant: 'solid',
          color: 'success',
        });
        refetch();
      } catch (err) {
        console.error('Failed to update coach status:', err);
      }
    },
    [user?.tenantId, refetch],
  );

  return isLoading ? (
    <div className="flex justify-center items-center h-full">
      <Spinner />
    </div>
  ) : (
    <Card className="bg-backgroundSecondary border border-border text-text">
      <CardHeader>
        <div className="flex flex-col">
          <div className="text-lg font-medium">Coach Approvals</div>
          <div className="text-sm font-light text-textSecondary">Manage coach approvals</div>
        </div>
      </CardHeader>
      <CardBody>
        {pendingApprovals?.total === 0 ? (
          <div className="flex justify-center items-center py-4">
            <p className="text-lg font-light text-textSecondary">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingApprovals?.coaches.map((coach) => (
              <div key={coach.id}>
                <Card>
                  <CardBody>
                    <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
                      <div className="flex flex-col">
                        <div className="text-lg font-medium">
                          {coach.firstName} {coach.lastName}
                        </div>
                        <div className="text-sm font-light text-textSecondary">{coach.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          variant="solid"
                          onPress={() => handleUpdateCoachStatus(coach.id, UserStatus.ACTIVE)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="solid"
                          onPress={() => handleUpdateCoachStatus(coach.id, UserStatus.INACTIVE)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                    {/* <Accordion
                    variant="light"
                    className="shadow-none border-none p-0"
                    selectionMode="multiple"
                  >
                    <AccordionItem
                      key={coach.id}
                      aria-label={`${coach.firstName} ${coach.lastName}`}
                      title={<div className="text-sm font-light text-text">Profile</div>}
                    >
                      <div className="flex flex-col gap-1">
                        <div>
                          <span className="text-sm font-light text-textSecondary">Bio:</span>{' '}
                          {coach.profile.bio}
                        </div>
                        <div>
                          <span className="text-sm font-light text-textSecondary">
                            Specializations:
                          </span>{' '}
                          {coach.profile.specializations.join(', ')}
                        </div>
                        <div>
                          <span className="text-sm font-light text-textSecondary">
                            Certifications:
                          </span>{' '}
                          {coach.profile.certifications.join(', ')}
                        </div>
                        <div>
                          <span className="text-sm font-light text-textSecondary">
                            Hourly Rate:
                          </span>{' '}
                          {coach.profile.hourly_rate} {coach.profile.currency}
                        </div>
                        <div>
                          <span className="text-sm font-light text-textSecondary">
                            Social Links:
                          </span>{' '}
                          {coach.profile.social_links.join(', ')}
                        </div>
                      </div>
                    </AccordionItem>
                  </Accordion> */}
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
