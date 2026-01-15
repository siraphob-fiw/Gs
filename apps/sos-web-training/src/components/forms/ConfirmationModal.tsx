'use client';

import React from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Button } from '@heroui/react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  confirmVariant = 'success',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      backdrop="blur"
      className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-text">{title}</ModalHeader>
            <ModalBody>
              <p className="text-text">{message}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="bordered"
                color="secondary"
                className="text-text"
                onPress={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
              <Button
                variant="solid"
                className={['success', 'danger'].includes(confirmVariant) ? 'text-white' : ''}
                onPress={onConfirm}
                isLoading={isLoading}
                color={confirmVariant}
              >
                {confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ConfirmationModal;
