'use client';

import React, { useState, useCallback } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ModalContent,
  Autocomplete,
  AutocompleteItem,
} from '@heroui/react';
import { UserResponseWithCoachIdDto } from '@/hooks/api/use-users';

interface InviteClientModalProps {
  isOpen: boolean;
  clientsData: UserResponseWithCoachIdDto[];
  onClose: () => void;
  onInvite: (clientId: string) => void;
}

export function InviteClientModal({
  isOpen,
  clientsData,
  onClose,
  onInvite,
}: InviteClientModalProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');

  const handleInvite = () => {
    if (selectedClient) {
      onInvite(selectedClient);
    }
  };

  const handleClose = useCallback(() => {
    setSelectedClient('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      backdrop="blur"
      className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
    >
      <ModalContent>
        <>
          <ModalHeader className="text-text">Invite Client</ModalHeader>
          <ModalBody className="text-text space-y-2">
            <div className="text-sm text-text">Invite a new client to your coaching :</div>
            <div className="space-y-3">
              <Autocomplete
                label="Search clients"
                selectedKey={selectedClient}
                variant="bordered"
                onSelectionChange={(e) => setSelectedClient(e as string)}
                classNames={{
                  selectorButton: 'text-text',
                  listboxWrapper: 'text-text',
                  popoverContent:
                    'rounded-lg border border-border bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                }}
              >
                {clientsData ? (
                  clientsData.map((client) => (
                    <AutocompleteItem key={client.id}>
                      {`${client.profile.firstName} ${client.profile.lastName}`}
                    </AutocompleteItem>
                  ))
                ) : (
                  <AutocompleteItem key="no-results">No results found</AutocompleteItem>
                )}
              </Autocomplete>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={handleClose} color="default">
              Cancel
            </Button>
            <Button variant="solid" color="primary" onPress={handleInvite}>
              Send Invite
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}

export default InviteClientModal;
