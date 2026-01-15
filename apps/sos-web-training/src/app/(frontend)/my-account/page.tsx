'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardHeader, CardBody, Skeleton, Tabs, Tab, addToast, Divider, Input, Button } from '@heroui/react';
import { useAuthApi } from '@/hooks/api/use-auth-api';
import { UserResponse, useUpdateUser } from '@/hooks/api/use-users';
import {
  UserRole,
  Gender,
  UserStatus,
  SupportedLanguage,
  RelationshipStatus,
} from '@strengthos/shared-types';
import SecuritySection from '@/components/account/SecuritySection';
import ProfileFormContainer from '@/components/account/profileForm';
import CoachDiscoveryProfileForm from '@/components/account/CoachDiscoveryProfileForm';
import { TrainingPreferences } from '@/components/preferences/TrainingPreferences';
import { useTranslation } from '@/hooks/api/useTranslation';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import {
  useCoachClients,
  useCoachDiscoveryProfile,
  useUpdateCoachDiscoveryProfile,
  useUpdateRelationshipStatus,
} from '@/hooks/api/use-coach-clients';
import { CoachDiscoveryProfile } from '@/types/coaching';
import dayjs from 'dayjs';
import { FaCheck } from 'react-icons/fa';
import ConfirmationModal from '@/components/forms/ConfirmationModal';

export default function MyAccountPage() {
  const { state } = useAuth();
  const user = state.user;
  const { data: userProfile, isLoading, isError, refetch } = useAuthApi();
  const updateMutation = useUpdateUser();
  const { t } = useTranslation();
  const { isCoach, isAdmin, isUser } = useRoleAccess();
  const { data: coachAthleteRelationships } = isCoach()
    ? useCoachClients({
        coach_id: user?.id || '',
        status: RelationshipStatus.ACTIVE,
      })
    : isUser()
      ? useCoachClients({
          athlete_id: user?.id || '',
          status: RelationshipStatus.ACTIVE,
        })
      : { data: null };
  const [removeCoachDialogOpen, setRemoveCoachDialogOpen] = useState(false);

  // Move initial data outside component to prevent recreation
  const getInitialUserProfileData = (): UserResponse => ({
    id: '',
    tenantId: '',
    email: '',
    phone: '',
    role: UserRole.ATHLETE,
    status: UserStatus.ACTIVE,
    phoneVerified: false,
    phoneVerifiedAt: new Date(),
    profile: {
      firstName: '',
      lastName: '',
      dateOfBirth: null,
      gender: Gender.MALE,
      bodyWeight: 0,
      height: 0,
    },
    preferences: {
      language: SupportedLanguage.EN,
      timezone: 'Asia/Bangkok',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    },
    auth_providers: {},
    whatsappData: {},
    lineData: {},
    created_at: new Date(),
    updated_at: new Date(),
    last_login_at: new Date(),
    email_verified_at: new Date(),
    suspended_at: undefined,
  });

  const [userProfileData, setUserProfileData] = useState<UserResponse>(getInitialUserProfileData());

  useEffect(() => {
    if (userProfile) {
      setUserProfileData(userProfile);
    }
  }, [userProfile]);

  // Memoize breadcrumbs to prevent recreation on every render
  const breadcrumbs = useMemo(
    () => [
      {
        label: t('nav.dashboard'),
        href: user?.role === UserRole.SUPER_ADMIN ? '/admin' : '/dashboard',
      },
      { label: t('user.myAccount') },
    ],
    [t, user?.role],
  );

  // Memoize page title
  const pageTitle = useMemo(() => t('user.myAccount'), [t]);

  // Memoize tab titles
  const tabTitles = useMemo(
    () => ({
      profile: t('account.tabs.profile'),
      preferences: t('account.tabs.preferences'),
      security: t('account.tabs.security'),
    }),
    [t],
  );

  const isCoachUser = useMemo(() => isCoach(), [isCoach]);
  const { data: coachDiscoveryProfile } = isCoachUser ? useCoachDiscoveryProfile() : { data: null };
  const [coachDiscoveryProfileData, setCoachDiscoveryProfileData] =
    useState<CoachDiscoveryProfile | null>(null);
  const updateCoachDiscoveryProfileMutation = useUpdateCoachDiscoveryProfile();

  useEffect(() => {
    if (coachDiscoveryProfile) {
      setCoachDiscoveryProfileData(coachDiscoveryProfile);
    }
  }, [coachDiscoveryProfile]);

  const [customCertificationsInput, setCustomCertificationsInput] = useState<string>('');
  const [customSpecializationsInput, setCustomSpecializationsInput] = useState<string>('');

  const deleteCoachAthleteRelationship = useUpdateRelationshipStatus();

  const handleUpdateCoachDiscoveryProfile = useCallback(async () => {
    if (!coachDiscoveryProfileData) {
      return;
    }
    try {
      await updateCoachDiscoveryProfileMutation.mutateAsync({
        bio: coachDiscoveryProfileData.bio,
        specializations: coachDiscoveryProfileData.specializations,
        certifications: coachDiscoveryProfileData.certifications,
        socialLinks: coachDiscoveryProfileData.socialLinks,
      });
      addToast({
        title: t('account.updateSuccess'),
        color: 'success',
      });
    } catch (err) {
      addToast({
        title: t('account.updateError'),
        color: 'danger',
      });
    }
  }, [coachDiscoveryProfileData, updateCoachDiscoveryProfileMutation, t]);

  const handleUpdateProfile = useCallback(
    async (data: {
      profile: {
        firstName: string;
        lastName: string;
        dateOfBirth: Date | null;
        gender: string;
        bodyWeight: string | null;
        height: string | null;
      };
      phone?: string;
    }) => {
      if (!user) {
        addToast({
          title: t('account.updateError'),
          color: 'danger',
        });
        return;
      }
      try {
        await updateMutation.mutateAsync(
          {
            id: user.id,
            data: {
              firstName: data.profile.firstName,
              lastName: data.profile.lastName,
              dateOfBirth: data.profile.dateOfBirth
                ? dayjs(data.profile.dateOfBirth).format('YYYY-MM-DD')
                : undefined,
              gender: data.profile.gender as Gender,
              bodyWeight: data.profile.bodyWeight ? Number(data.profile.bodyWeight) : undefined,
              height: data.profile.height ? Number(data.profile.height) : undefined,
              phone: data.phone ? String(data.phone) : undefined,
            },
          },
          {
            onSuccess: () => {
              addToast({
                title: t('account.updateSuccess'),
                color: 'success',
              });
              refetch();
            },
            onError: () => {
              addToast({
                title: t('account.updateError'),
                color: 'danger',
              });
              refetch();
            },
          },
        );
      } catch (err) {
        addToast({
          title: t('account.updateError'),
          color: 'danger',
        });
      }
    },
    [user, updateMutation, t, refetch],
  );

  const handleRemoveCoach = async () => {
    const relationshipId = coachAthleteRelationships?.relationships[0]?.id || '';
    if (!relationshipId) {
      addToast({
        title: t('account.removeCoachError'),
        color: 'danger',
      });
      return;
    }

    await deleteCoachAthleteRelationship.mutateAsync({
      relationshipId: relationshipId,
      status: RelationshipStatus.TERMINATED,
    }, {
      onSuccess: () => {
        addToast({
          title: t('account.removeCoachSuccess'),
          variant: 'solid',
          color: 'success',
        });
      },
      onError: () => {
        addToast({
          title: t('account.removeCoachError'),
          variant: 'solid',
          color: 'danger',
        });
      },
    });
  };

  const ProfileForm = useMemo(() => {
    return (
      <Card className="bg-backgroundSecondary border border-border">
        <CardHeader>
          <h3 className="text-lg font-medium text-text">{t('user.profile')}</h3>
        </CardHeader>
        <CardBody className="text-text flex flex-col gap-3">
          {isUser() &&
            coachAthleteRelationships &&
            coachAthleteRelationships.relationships.length > 0 && (
              <div className='flex flex-col gap-2'>
                <p className="font-medium flex items-center gap-2">{t('account.activeCoach')} <FaCheck className="text-success" size={16} /></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input 
                    label={t('account.coachName')}
                    value={`${coachAthleteRelationships.relationships[0].coach_firstName} ${coachAthleteRelationships.relationships[0].coach_lastName}`}
                    disabled
                    variant="bordered"
                    classNames={{
                      inputWrapper: 'bg-backgroundSecondary',
                      input: 'text-text',
                    }}
                  />
                  <Input 
                    label={t('account.coachEmail')}
                    value={coachAthleteRelationships.relationships[0].coach_email}
                    disabled
                    variant="bordered"
                    classNames={{
                      inputWrapper: 'bg-backgroundSecondary',
                      input: 'text-text',
                    }}
                  />
                </div>
                <Button
                  color="danger"
                  variant="solid"
                  size="sm"
                  className='w-fit ml-auto'
                  onPress={() => {
                    setRemoveCoachDialogOpen(true);
                  }}
                >
                  {t('account.removeCoach')}
                </Button>
              </div>
            )
          }

          <ConfirmationModal
            isOpen={removeCoachDialogOpen}
            title={t('account.removeCoach')}
            message={t('account.removeCoachMessage')}
            onClose={() => {
              setRemoveCoachDialogOpen(false);
            }}
            onConfirm={() => {
              handleRemoveCoach();
            }}
          />
          <ProfileFormContainer
            user={userProfileData}
            onSubmit={handleUpdateProfile}
            canEditRole={isAdmin()}
          />
          {isCoachUser && (
            <>
              <Divider />
              <CoachDiscoveryProfileForm
                coachDiscoveryProfileData={coachDiscoveryProfileData}
                setCoachDiscoveryProfileData={setCoachDiscoveryProfileData}
                customCertificationsInput={customCertificationsInput}
                setCustomCertificationsInput={setCustomCertificationsInput}
                customSpecializationsInput={customSpecializationsInput}
                setCustomSpecializationsInput={setCustomSpecializationsInput}
                updateCoachDiscoveryProfileMutation={updateCoachDiscoveryProfileMutation}
                handleUpdateCoachDiscoveryProfile={handleUpdateCoachDiscoveryProfile}
              />
            </>
          )}
        </CardBody>
      </Card>
    );
  }, [
    t,
    userProfileData,
    handleUpdateProfile,
    isAdmin,
    isCoachUser,
    coachDiscoveryProfileData,
    customCertificationsInput,
    customSpecializationsInput,
    updateCoachDiscoveryProfileMutation,
    handleUpdateCoachDiscoveryProfile,
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info"></div>
        </div>
      }
    >
      <PageWrapper title={pageTitle} breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Error or Loading States */}
          {isLoading ? (
            <Skeleton className="bg-backgroundSecondary border border-border h-12 w-full rounded-lg" />
          ) : isError ? (
            <Card>
              <CardBody className="text-danger">{t('account.loadProfileError')}</CardBody>
            </Card>
          ) : (
            userProfileData && (
              <Tabs
                classNames={{ tabContent: 'text-text group-data-[selected=true]:text-white' }}
                variant="bordered"
                color="primary"
              >
                <Tab title={tabTitles.profile}>{ProfileForm}</Tab>
                <Tab title={tabTitles.preferences}>
                  <TrainingPreferences userId={user?.id ?? ''} key={user?.id} />
                </Tab>
                <Tab title={tabTitles.security}>
                  <SecuritySection />
                </Tab>
              </Tabs>
            )
          )}
        </div>
      </PageWrapper>
    </Suspense>
  );
}
