'use client';

import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { useUsers } from '@/hooks/api/use-users';
import { UserRole, UserStatus } from '@strengthos/shared-types';

export function ApprovalCoach() {
  const { data: pendingCoachRequests } = useUsers({
    role: UserRole.COACH,
    status: UserStatus.PENDING_APPROVAL,
  });

  return (
    <Card className="bg-backgroundSecondary text-text border border-border">
      <CardBody>
        <div className="text-2xl font-semibold">Coach Approval</div>
        <p>This component will handle coach approvals.</p>
        <div className="flex flex-col gap-2">
          {pendingCoachRequests?.users.map((user) => (
            <div key={user.id}>
              {user.profile.firstName} {user.profile.lastName} - {user.email}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
