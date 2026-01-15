'use client';

import React, { useMemo, useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import {
  TableCell,
  TableRow,
  TableBody,
  TableHeader,
  TableColumn,
  Table,
  Button,
  addToast,
} from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { useCoachClients, useCreateRelationship, useUpdateRelationshipStatus } from '@/hooks/api/use-coach-clients';
import dayjs from 'dayjs';
import { FaTrash } from 'react-icons/fa';
import { ConfirmationModal } from '@/components/forms/ConfirmationModal';
import { RelationshipStatus, UserRole } from '@strengthos/shared-types';
import { useAthleteInvitation } from '@/hooks/api/use-users';
import InviteClientModal from '@/components/coaching/InviteClientModal';

export default function CoachAthletesPage() {
  const { state } = useAuth();
  const users = state.user;
  const { isAdmin } = useRoleAccess();
  const [athleteIdToDelete, setAthleteIdToDelete] = useState<string>('');
  const breadcrumbs = [
    { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
    { label: 'Athletes management' },
  ];
  const { data: usersData } = useAthleteInvitation({ role: UserRole.ATHLETE, availableToInvite: true });
  const { data: relationAthlete } = useCoachClients({
    coach_id: users?.id,
    status: RelationshipStatus.ACTIVE,
  });
  const deleteCoachAthleteRelationship = useUpdateRelationshipStatus();
  
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const createCoachAthleteRelationship = useCreateRelationship();
  
  const handleDeleteAthlete = async (athleteId: string) => {
    await deleteCoachAthleteRelationship.mutateAsync({
      relationshipId: athleteId,
      status: RelationshipStatus.TERMINATED,
    }, {
      onSuccess: () => {
        addToast({
          title: 'Athlete removed successfully',
          variant: 'solid',
          color: 'success',
        });
      },
      onError: () => {
        addToast({
          title: 'Failed to remove athlete',
          variant: 'solid',
          color: 'danger',
        });
      },
    });
  };

  const handleAddAthlete = async (athleteId: string) => {
    await createCoachAthleteRelationship.mutateAsync({
      coach_id: users?.id || '',
      athlete_id: athleteId,
    }, {
      onSuccess: () => {
        addToast({
          title: 'Athlete added successfully',
          variant: 'solid',
          color: 'success',
        });
      },
      onError: () => {
        addToast({
          title: 'Failed to add athlete',
          variant: 'solid',
          color: 'danger',
        });
      },
      onSettled: () => {
        setInviteModalOpen(false);
      },
    });
  };

  const actions = useMemo(() => {
    return (
      <Button
        variant="solid"
        color="primary"
        onPress={() => {
          setInviteModalOpen(true);
        }}
      >
        Invite Athlete
      </Button>
    );
  }, []);

  return (
      <PageWrapper title="Athletes management" breadcrumbs={breadcrumbs} actions={actions}>

      <Table>
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Email</TableColumn>
          <TableColumn>Last Activity</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent="No data"
          items={
            relationAthlete && relationAthlete.relationships.length > 0
              ? relationAthlete.relationships
              : []
          }
        >
          {(athlete) => (
            <TableRow key={athlete.id}>
              <TableCell>
                {athlete.athlete_firstName} {athlete.athlete_lastName}
              </TableCell>
              <TableCell>{athlete.athlete_email}</TableCell>
              <TableCell>{athlete.last_activity ? dayjs(athlete.last_activity).format('DD/MM/YYYY') : 'N/A'}</TableCell>
              <TableCell>
                <Button
                  variant="solid"
                  color="danger"
                  isIconOnly
                  onPress={() => {
                    setAthleteIdToDelete(athlete.id);
                  }}
                >
                  <FaTrash />
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <InviteClientModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        clientsData={usersData?.users || []}
        onInvite={(athleteId) => {
          handleAddAthlete(athleteId);
        }}
      />

      <ConfirmationModal
        isOpen={athleteIdToDelete !== ''}
        onClose={() => setAthleteIdToDelete('')}
        onConfirm={() => {
          handleDeleteAthlete(athleteIdToDelete);
        }}
        title="Remove Athlete"
        message="Are you sure you want to delete this athlete? This action cannot be undone."
      />
    </PageWrapper>
  );
}
