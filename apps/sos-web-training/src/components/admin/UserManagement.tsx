'use client';

import {
  CardBody,
  CardHeader,
  Button,
  Chip,
  Input,
  Alert,
  SelectItem,
  Modal,
  ModalHeader,
  ModalContent,
  ModalBody,
  AccordionItem,
  Card,
  Accordion,
  Skeleton,
  CardFooter,
  Pagination,
} from '@heroui/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { FaUser, FaCalendar, FaFilter, FaEdit, FaUserTie } from 'react-icons/fa';
import ConfirmationModal from '../forms/ConfirmationModal';
import { HiMiniArrowUturnLeft } from 'react-icons/hi2';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { SelectWithClassName } from '../forms/selectWithClassName';
import { LuMail, LuPhone } from 'react-icons/lu';
import { FaRegCalendarCheck, FaTrash, FaBuilding } from 'react-icons/fa';
import {
  TenantUserFilters,
  UpdateUserRequest,
  useAssignRoleUser,
  useAssignTenant,
  useDeleteUser,
  UserListResponse,
  UserResponse,
  useTenantUsers,
  useTenantUserStats,
  useUpdateUser,
  useUpdateUserStatus,
} from '@/hooks/api/use-users';
import { useTenants } from '@/hooks/api/use-tenants';
import { UserRole, UserStatus } from '@strengthos/shared-types';
import { UseQueryResult } from '@tanstack/react-query';
import ProfileFormContainer from '../account/profileForm';
import { useTranslation } from '@/hooks/api/useTranslation';
import dayjs from 'dayjs';
import useRoleAccess from '@/hooks/api/use-role-access';

interface TenantUserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  usersByStatus: Record<string, number>;
  recentRegistrations: number;
}

export function UserManagement() {
  const { state, refreshToken } = useAuth();
  const user = state.user;
  const { t } = useTranslation('tenantUserManagement');
  const [filters, setFilters] = useState<TenantUserFilters>({
    page: 1,
    limit: 20,
  });
  const {
    data: usersData,
    isLoading: loadingUsers,
    isError: usersError,
    refetch: refetchUsers,
  } = useTenantUsers(filters) as UseQueryResult<UserListResponse, Error>;
  const {
    data: statsData,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useTenantUserStats() as UseQueryResult<TenantUserStats, Error>;
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const updateUserMutation = useUpdateUser();
  const assignRoleMutation = useAssignRoleUser();
  const updateUserStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();
  const assignTenantMutation = useAssignTenant();
  const { isAdmin } = useRoleAccess();
  // Fetch tenants list for SUPER_ADMIN
  const { data: tenantsData } = isAdmin() ? useTenants() : { data: [] };
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (usersData) {
      let total = 0;
      usersData.users.forEach((user) => {
        if(user.role !== UserRole.SUPER_ADMIN) {
          total++;
        }
      });
      setTotalUsers(total);
    }
  }, [usersData]);

  const canManageUsers = () => {
    return ['SUPER_ADMIN', 'TENANT_ADMIN', 'COACH_ADMIN'].includes(user?.role || '');
  };

  const handleRemoveUser = async () => {
    if (selectedUser?.status === UserStatus.SUSPENDED) {
      await updateUserStatusMutation.mutateAsync(
        {
          userId: selectedUser?.id ?? '',
          status: UserStatus.ACTIVE,
        },
        {
          onSuccess: () => {
            setSelectedUser(null);
            setIsConfirmDialogOpen(false);
            refetchUsers();
          },
        },
      );
    } else {
      await deleteUserMutation.mutateAsync(
        {
          userId: selectedUser?.id ?? '',
          tenantId: selectedUser?.tenantId ?? '',
        },
        {
          onSuccess: () => {
            setSelectedUser(null);
            setIsConfirmDialogOpen(false);
            refetchUsers();
          },
        },
      );
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      case 'SUSPENDED':
        return 'danger';
      case 'PENDING_VERIFICATION':
        return 'warning';
      default:
        return 'primary';
    }
  };

  if (!canManageUsers()) {
    return <Alert description={t('permissionDenied')} title={t('permissionDeniedTitle')} />;
  }

  const HandleUpdateUser = async (e: UserResponse) => {
    if (selectedUser === null) return;
    let payload: UpdateUserRequest = {};

    if (e.status) payload.status = e.status;
    if (e.profile.firstName) payload.firstName = e.profile.firstName;
    if (e.profile.lastName) payload.lastName = e.profile.lastName;
    if (e.profile.dateOfBirth)
      payload.dateOfBirth = dayjs(e.profile.dateOfBirth).format('YYYY-MM-DD');
    if (e.profile.gender) payload.gender = e.profile.gender;
    if (e.profile.bodyWeight) payload.bodyWeight = e.profile.bodyWeight;
    if (e.profile.height) payload.height = e.profile.height;
    if (e.phone) {
      payload.phone = e.phone;
    }

    const promises: Promise<unknown>[] = [];

    if ((user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.TENANT_ADMIN) && e.role) {
      promises.push(
        assignRoleMutation.mutateAsync({
          userId: selectedUser.id,
          role: e.role,
        }),
      );
    }

    promises.push(
      updateUserMutation.mutateAsync({
        id: selectedUser.id,
        data: payload,
      }),
    );

    try {
      await Promise.all(promises);
      if (user?.id === selectedUser.id) {
        refreshToken();
        window.location.reload();
      }
      refetchUsers();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleAssignTenant = async (tenantId: string) => {
    if (!selectedUser) return;
    try {
      await assignTenantMutation.mutateAsync({
        userId: selectedUser.id,
        tenantId,
      });
      refetchUsers();
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error assigning tenant:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full user-management-container">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-semibold">{t('title')}</div>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          onPress={() => {
            refetchUsers();
            refetchStats();
          }}
          variant="solid"
          color="primary"
        >
          {t('refresh')}
        </Button>
      </div>

      {!!statsData &&
        typeof statsData === 'object' &&
        (loadingStats ? (
          <Skeleton className="flex bg-backgroundSecondary rounded-lg w-full h-32" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-backgroundSecondary text-text border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">{t('totalUsers')}</div>
                <FaUser />
              </CardHeader>
              <CardBody>
                <div className="text-2xl font-semibold">{statsData?.totalUsers ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {(statsData?.activeUsers ?? 0) - (statsData?.usersByRole?.SUPER_ADMIN ?? 0)}{' '}
                  {t('active')}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-backgroundSecondary text-text border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">{t('coaches')}</div>
                <FaUser />
              </CardHeader>
              <CardBody>
                <div className="text-2xl font-semibold">
                  {(statsData?.usersByRole?.COACH ?? 0) +
                    (statsData?.usersByRole?.COACH_ADMIN ?? 0) +
                    (statsData?.usersByRole?.SELF_COACHED ?? 0)}
                </div>
              </CardBody>
            </Card>

            <Card className="bg-backgroundSecondary text-text border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">{t('athletes')}</div>
                <FaUser />
              </CardHeader>
              <CardBody>
                <div className="text-2xl font-semibold">{statsData?.usersByRole?.ATHLETE ?? 0}</div>
              </CardBody>
            </Card>

            <Card className="bg-backgroundSecondary text-text border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">{t('newUsers')}</div>
                <FaCalendar />
              </CardHeader>
              <CardBody>
                <div className="text-2xl font-semibold">{statsData?.recentRegistrations ?? 0}</div>
                <p className="text-xs text-muted-foreground">{t('last30Days')}</p>
              </CardBody>
            </Card>
          </div>
        ))}

      {/* Filters */}
      <Accordion
        variant="splitted"
        className="w-full px-0"
        itemClasses={{
          base: 'bg-backgroundSecondary border border-border',
          title: 'text-text',
        }}
      >
        <AccordionItem
          title={
            <div className="flex items-center gap-2">
              <FaFilter className="text-text" />
              {t('filters')}
            </div>
          }
          aria-label={t('filters')}
          key="filters"
        >
          <div className="flex flex-col gap-4 justify-center items-center mb-4">
            <Input
              label={t('search')}
              variant="bordered"
              classNames={{
                inputWrapper: 'bg-backgroundSecondary group-data-[focus=true]:border-border',
                input: 'text-text',
              }}
              startContent={<FaMagnifyingGlass className="text-text" />}
              placeholder={t('searchPlaceholder')}
              value={filters.search ?? ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectWithClassName
                fullwidth
                id="role-filters"
                aria-label="Role filters"
                selectedKeys={[filters.role ?? 'all']}
                onSelectionChange={(value: any) => {
                  setFilters({
                    ...filters,
                    role: value.currentKey === 'all' ? undefined : value.currentKey,
                  });
                }}
                selectorIconColor="text-text"
                classNames={{
                  trigger: 'bg-backgroundSecondary group-data-[focus=true]:border-border',
                  label: 'text-text',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
                  selectorIcon: 'text-text',
                }}
                children={
                  <>
                    <SelectItem key="all">{t('allRoles')}</SelectItem>
                    <SelectItem key="COACH">{t('coach', { defaultValue: 'Coach' })}</SelectItem>
                    <SelectItem key="ATHLETE">
                      {t('athlete', { defaultValue: 'Athlete' })}
                    </SelectItem>
                    <SelectItem key="SELF_COACHED">
                      {t('selfCoached', { defaultValue: 'Self-Coached' })}
                    </SelectItem>
                    <SelectItem key="TENANT_ADMIN">
                      {t('tenantAdmin', { defaultValue: 'Tenant Admin' })}
                    </SelectItem>
                  </>
                }
              />

              <SelectWithClassName
                fullwidth
                id="status-filters"
                aria-label="Status filters"
                selectedKeys={[filters.status ?? 'all']}
                onSelectionChange={(value: any) =>
                  setFilters({
                    ...filters,
                    status: value.currentKey === 'all' ? undefined : value.currentKey,
                    page: 1,
                  })
                }
                selectorIconColor="text-text"
                classNames={{
                  trigger: 'bg-backgroundSecondary group-data-[focus=true]:border-border',
                  label: 'text-text',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
                  selectorIcon: 'text-text',
                }}
                children={
                  <>
                    <SelectItem key="all">{t('allStatus')}</SelectItem>
                    <SelectItem key="ACTIVE">{t('active', { defaultValue: 'Active' })}</SelectItem>
                    <SelectItem key="INACTIVE">
                      {t('inactive', { defaultValue: 'Inactive' })}
                    </SelectItem>
                    <SelectItem key="SUSPENDED">
                      {t('suspended', { defaultValue: 'Suspended' })}
                    </SelectItem>
                    <SelectItem key="PENDING_VERIFICATION">
                      {t('pendingVerification', { defaultValue: 'Pending Verification' })}
                    </SelectItem>
                    <SelectItem key="PENDING_APPROVAL">
                      {t('pendingApproval', { defaultValue: 'Pending Approval' })}
                    </SelectItem>
                  </>
                }
              />
            </div>
          </div>
        </AccordionItem>
      </Accordion>

      {/* Users List */}
      <Card className="bg-backgroundSecondary text-text border border-border">
        <CardHeader className="text-text">
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FaUser />
              {t('users')} ({totalUsers})
            </div>
            <div>{t('manageDescription')}</div>
            <div className="flex justify-between items-center gap-2">
              <SelectWithClassName
                className="w-40"
                id="limit-filters"
                label={t('limit')}
                labelPlacement="outside-left"
                aria-label="limit"
                disallowEmptySelection
                selectedKeys={[filters.limit?.toString() ?? '10']}
                onSelectionChange={(value: any) => {
                  setFilters({ ...filters, limit: Number(value.currentKey), page: 1 });
                }}
                selectorIconColor="text-text"
                classNames={{
                  label: 'text-text',
                  trigger: 'bg-backgroundSecondary group-data-[focus=true]:border-border',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox: 'rounded-md border border-border data-[hover=true]:bg-background',
                  selectorIcon: 'text-text',
                }}
              >
                <SelectItem key="5">5</SelectItem>
                <SelectItem key="10">10</SelectItem>
                <SelectItem key="20">20</SelectItem>
                <SelectItem key="50">50</SelectItem>
                <SelectItem key="100">100</SelectItem>
              </SelectWithClassName>
              <div className="text-sm text-muted-foreground">
                {totalUsers === 0 ? null : (
                  <>
                    {t('showingUsers', {
                      interpolation: {
                        start: ((filters.page ?? 1) - 1) * (filters.limit ?? 10) + 1,
                        end: Math.min((filters.page ?? 1) * (filters.limit ?? 10), totalUsers),
                        total: totalUsers,
                      },
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loadingUsers ? (
            <Skeleton className="flex bg-backgroundSecondary rounded-lg w-full h-32" />
          ) : usersError ? (
            <div className="flex justify-center items-center h-full">
              <Alert description={t('failedToLoadUsers')} title={t('error')} />
            </div>
          ) : (
            <div className="space-y-4">
              {usersData?.users?.filter((user) => user.role !== UserRole.SUPER_ADMIN).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border-2 border-border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">
                        {user.profile.firstName} {user.profile.lastName}
                      </h4>
                      <Chip variant="solid" color="primary">
                        {user.role.replace('_', ' ')}
                      </Chip>
                      <Chip
                        variant="solid"
                        color={`${getStatusBadgeColor(user.status)}`}
                        className={`${user.status == 'ACTIVE' ? 'text-white' : ''}`}
                      >
                        {user.status.replace('_', ' ')}
                      </Chip>
                      {user.role !== UserRole.SUPER_ADMIN && 
                        <Chip
                          variant="solid"
                          className="text-white"
                          color="warning"
                          startContent={<FaBuilding className="ml-1" />}
                        >
                          {user.tenantName ||
                            (user.tenantId
                              ? user.tenantId.substring(0, 8) + '...'
                              : t('noTenant', { defaultValue: 'No Tenant' }))}
                        </Chip>
                      }
                    </div>
                    <div className="flex flex-col gap-2 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <LuMail />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <LuPhone />
                          {user.phone}
                        </div>
                      )}
                      {user.coachName && (
                        <div className="flex items-center gap-1">
                          <FaUserTie />
                          {user.coachName}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FaRegCalendarCheck />
                        {t('joined')} {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="bordered"
                        color="primary"
                        onPress={() => {
                          setSelectedUser(user);
                          setEditDialogOpen(true);
                        }}
                      >
                        <FaEdit className="text-text" />
                        <span className="text-sm text-text font-medium">{t('edit')}</span>
                      </Button>
                    </div>
                    {user.role !== 'SUPER_ADMIN' && (
                      <Button
                        variant="solid"
                        color={user.status !== 'SUSPENDED' ? 'danger' : 'success'}
                        onPress={() => {
                          setSelectedUser(user);
                          setIsConfirmDialogOpen(true);
                        }}
                        className="text-white"
                      >
                        {user.status !== 'SUSPENDED' ? (
                          <>
                            <FaTrash className="text-white" />
                            <span className="text-sm font-medium">{t('suspend')}</span>
                          </>
                        ) : (
                          <>
                            <HiMiniArrowUturnLeft className="text-white" />
                            <span className="text-sm font-medium">{t('reactivate')}</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
        <CardFooter className="flex justify-center">
          {Math.ceil(totalUsers / (filters.limit ?? 10)) > 1 && (
            <Pagination
              loop
              showControls
              total={Math.ceil(totalUsers / (filters.limit ?? 10))}
              page={filters.page ?? 1}
              onChange={(page: any) => {
                setFilters({ ...filters, page });
              }}
            />
          )}
        </CardFooter>
      </Card>

      <Modal
        size="2xl"
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        classNames={{
          base: 'bg-backgroundSecondary border border-border',
        }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-border">
            <div className="text-xl font-medium">{t('editUser')}</div>
          </ModalHeader>
          <ModalBody>
            {selectedUser && (
              <ProfileFormContainer
                user={selectedUser}
                onSubmit={HandleUpdateUser}
                onCancel={() => setEditDialogOpen(false)}
                canEditRole={
                  user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.TENANT_ADMIN
                }
                canAssignTenant={isSuperAdmin && selectedUser.role !== UserRole.SUPER_ADMIN}
                tenants={tenantsData ?? []}
                onAssignTenant={handleAssignTenant}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => {
          handleRemoveUser();
        }}
        title={t('confirmation')}
        message={t('confirmRemoveMessage')}
        confirmText={selectedUser?.status !== 'SUSPENDED' ? t('remove') : t('reactivate')}
        cancelText={t('cancel', { defaultValue: 'Cancel' })}
        confirmVariant={selectedUser?.status !== 'SUSPENDED' ? 'danger' : 'success'}
      />
    </div>
  );
}
