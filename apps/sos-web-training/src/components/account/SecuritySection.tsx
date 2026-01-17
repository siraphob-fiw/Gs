import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Modal,
  ModalBody,
  Input,
  ModalContent,
  ModalHeader,
  ModalFooter,
  addToast,
} from '@heroui/react';
import {
  useChangePasswordApi,
  useSendResetPasswordEmailApi,
  useAuthApi,
  useSetUpPasswordApi,
} from '@/hooks/api/use-auth-api';
import { CiLock } from 'react-icons/ci';

export function SecuritySection() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<string | null>(null);
  const [resetPassOpen, setResetPassOpen] = useState(false);
  const [formChangePassword, setFormChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [formResetPassword, setFormResetPassword] = useState({
    email: '',
  });
  const changePasswordMutation = useChangePasswordApi();
  const setupPaswordMutation = useSetUpPasswordApi();
  const sendResetPasswordEmailMutation = useSendResetPasswordEmailApi();
  const [isPasswordMismatch, setIsPasswordMismatch] = useState(false);
  const { data: userProfile } = useAuthApi();

  const hasPassword = userProfile?.hasPassword;

  const handlePasswordAction = useCallback(() => {
    if(isPasswordModalOpen == 'change') {
      if (formChangePassword.newPassword !== formChangePassword.confirmNewPassword) {
        setIsPasswordMismatch(true);
        addToast({
          title: 'Passwords do not match',
          description: 'Please ensure your new passwords match.',
          variant: 'solid',
          color: 'danger',
        });
        return;
      }
      setIsPasswordMismatch(false);

      let mutationArgs: any = {};
      let successTitle = '';
      let failTitle = '';
      let descSuccess = '';

      mutationArgs = {
        currentPassword: formChangePassword.currentPassword,
        newPassword: formChangePassword.newPassword,
      };
      successTitle = 'Password changed successfully';
      failTitle = 'Failed to change password';
      descSuccess = 'Your password has been changed successfully';

      changePasswordMutation.mutate(mutationArgs, {
        onSuccess: (data: { success: boolean; message: string }) => {
          if (data?.success) {
            addToast({
              title: successTitle,
              description: descSuccess || undefined,
              variant: 'solid',
              color: 'success',
            });
            setIsPasswordModalOpen(null);
          } else {
            addToast({
              title: failTitle,
              description: data?.message || undefined,
              variant: 'solid',
              color: 'danger',
            });
          }
          setFormChangePassword({
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
          });
        },
        onError: (error: any) => {
          addToast({
            title: failTitle,
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      });
    } else if (isPasswordModalOpen == 'setup') {
       if (formChangePassword.newPassword !== formChangePassword.confirmNewPassword) {
        setIsPasswordMismatch(true);
        addToast({
          title: 'Passwords do not match',
          description: 'Please ensure your new passwords match.',
          variant: 'solid',
          color: 'danger',
        });
        return;
      }
      setIsPasswordMismatch(false);

      
      let mutationArgs: any = {};
      let successTitle = '';
      let failTitle = '';
      let descSuccess = '';

      mutationArgs = {
        currentPassword: formChangePassword.currentPassword,
        newPassword: formChangePassword.newPassword,
      };
      successTitle = 'Password changed successfully';
      failTitle = 'Failed to change password';
      descSuccess = 'Your password has been changed successfully';

       setupPaswordMutation.mutate(mutationArgs, {
        onSuccess: (data: { success: boolean; message: string }) => {
          if (data?.success) {
            addToast({
              title: successTitle,
              description: descSuccess || undefined,
              variant: 'solid',
              color: 'success',
            });
            setIsPasswordModalOpen(null);
          } else {
            addToast({
              title: failTitle,
              description: data?.message || undefined,
              variant: 'solid',
              color: 'danger',
            });
          }
          setFormChangePassword({
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
          });
        },
        onError: (error: any) => {
          addToast({
            title: failTitle,
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      });
    }  
  }, [formChangePassword, changePasswordMutation]);

  const handleResetPassword = useCallback(() => {
    sendResetPasswordEmailMutation.mutate(
      { email: formResetPassword.email },
      {
        onSuccess: (data: { success: boolean; message: string }) => {
          if (data?.success) {
            addToast({
              title: 'Password reset instructions sent to your email',
              variant: 'solid',
              color: 'success',
            });
          } else {
            addToast({
              title: 'Failed to send password reset instructions',
              description: data?.message,
              variant: 'solid',
              color: 'danger',
            });
          }
          setResetPassOpen(false);
        },
        onError: (error: any) => {
          addToast({
            title: 'Failed to send password reset instructions',
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      },
    );
    setResetPassOpen(false);
    setFormResetPassword({ email: '' });
  }, [formResetPassword.email, sendResetPasswordEmailMutation]);

  const handleCurrentPasswordChange = useCallback((value: string) => {
    setFormChangePassword((prev) => ({
      ...prev,
      currentPassword: value,
    }));
  }, []);

  const handleNewPasswordChange = useCallback((value: string) => {
    setFormChangePassword((prev) => ({
      ...prev,
      newPassword: value,
    }));
  }, []);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setFormChangePassword((prev) => ({
      ...prev,
      confirmNewPassword: value,
    }));
  }, []);

  const handleResetEmailChange = useCallback((value: string) => {
    setFormResetPassword((prev) => ({ ...prev, email: value }));
  }, []);

  return (
    <>
      <Card className="bg-backgroundSecondary border border-border">
        <CardHeader>
          <h3 className="text-lg font-medium text-text">Account Security</h3>
        </CardHeader>
        <CardBody className="text-text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasPassword ? (
              <Card className="bg-backgroundSecondary border border-border">
                <CardHeader className="flex items-center gap-2">
                  <CiLock className="w-6 h-6 text-text" />
                  <div className="font-light text-text">Password</div>
                </CardHeader>
                <CardBody className="px-6 py-6 bg-background border-t border-border">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between flex-wrap gap-3 md:gap-6">
                      <div>
                        <div className="text-base font-semibold text-text mb-1">
                          Change Password
                        </div>
                        <div className="text-xs text-textSecondary">
                          It's a good idea to update your password regularly for increased security.
                        </div>
                      </div>
                      <Button
                        variant="solid"
                        color="primary"
                        size="sm"
                        className="rounded-md font-medium px-6 py-2 text-sm"
                        onPress={() => setIsPasswordModalOpen('change')}
                        isLoading={changePasswordMutation.isPending}
                      >
                        Change
                      </Button>
                    </div>
                    <div className="flex items-start justify-between flex-wrap gap-3 md:gap-6 border-t border-border pt-5 mt-2">
                      <div>
                        <div className="text-base font-semibold text-text mb-1">
                          Forgot your password?
                        </div>
                        <div className="text-xs text-textSecondary">
                          Reset your password using your email address.
                        </div>
                      </div>
                      <Button
                        variant="solid"
                        color="danger"
                        size="sm"
                        className="rounded-md font-medium px-6 py-2 text-sm"
                        onPress={() => setResetPassOpen(true)}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <Card className="bg-backgroundSecondary border border-border">
                <CardHeader className="flex items-center gap-2">
                  <CiLock className="w-6 h-6 text-text" />
                  <div className="font-light text-text">Password</div>
                </CardHeader>
                <CardBody className="px-6 py-6 bg-background border-t border-border">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between flex-wrap gap-3 md:gap-6">
                      <div>
                        <div className="text-base font-semibold text-text mb-1">
                          Set Up Password
                        </div>
                        <div className="text-xs text-textSecondary">
                          You don't have a password set up yet. Create one to secure your account
                          and enable password-based login.
                        </div>
                      </div>
                      <Button
                        variant="solid"
                        color="primary"
                        size="sm"
                        className="rounded-md font-medium px-6 py-2 text-sm"
                        onPress={() => setIsPasswordModalOpen('setup')}
                        isLoading={changePasswordMutation.isPending}
                      >
                        Set up
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal
        isOpen={isPasswordModalOpen != null}
        onOpenChange={(isOpen) => !isOpen && setIsPasswordModalOpen(null)}
        backdrop="blur"
        className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
      >
        <ModalContent>
          <ModalHeader>
            {isPasswordModalOpen && isPasswordModalOpen?.charAt(0).toUpperCase() + isPasswordModalOpen?.slice(1)}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {
                isPasswordModalOpen == 'change' && (
                  <Input
                    type="password"
                    classNames={{
                      input: 'text-text group-data-[focus=true]:text-text',
                      label: 'text-text',
                      inputWrapper: 'bg-backgroundSecondary border border-border text-text',
                    }}
                    label="Current Password"
                    value={formChangePassword.currentPassword}
                    onValueChange={handleCurrentPasswordChange}
                  />
                )
              }
              <Input
                type="password"
                classNames={{
                  input: 'text-text group-data-[focus=true]:text-text',
                  label: 'text-text',
                  inputWrapper: 'bg-backgroundSecondary border border-border text-text',
                }}
                label="New Password"
                value={formChangePassword.newPassword}
                onValueChange={handleNewPasswordChange}
              />
              <Input
                type="password"
                classNames={{
                  input: 'text-text group-data-[focus=true]:text-text',
                  label: 'text-text',
                  inputWrapper: 'bg-backgroundSecondary border border-border text-text',
                }}
                label="Confirm New Password"
                value={formChangePassword.confirmNewPassword}
                isInvalid={isPasswordMismatch}
                errorMessage={isPasswordMismatch ? 'Passwords do not match' : undefined}
                onValueChange={handleConfirmPasswordChange}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="solid" size="sm" color="primary" onPress={handlePasswordAction}>
              Change Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={resetPassOpen}
        onOpenChange={setResetPassOpen}
        backdrop="blur"
        className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
      >
        <ModalContent>
          <ModalHeader>Reset Password</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                classNames={{
                  input: 'text-text group-data-[focus=true]:text-text',
                  label: 'text-text',
                  inputWrapper: 'bg-backgroundSecondary border border-border text-text',
                }}
                type="email"
                label="Email"
                value={formResetPassword.email}
                onValueChange={handleResetEmailChange}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="solid" color="primary" onPress={handleResetPassword}>
              Send Reset Link
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default SecuritySection;
