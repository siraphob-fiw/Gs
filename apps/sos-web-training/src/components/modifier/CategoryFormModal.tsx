'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  SelectItem,
} from '@heroui/react';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { CreateModifierCategoryDto, EditModifierCategoryDto } from '@/hooks/api/use-modifier';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateModifierCategoryDto | EditModifierCategoryDto) => void;
  initialData?: {
    id: string;
    name: string;
    description: string;
    status: string;
  };
  isAdmin?: boolean;
  isLoading?: boolean;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isAdmin = true,
  isLoading = false,
}: CategoryFormModalProps) {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        status: initialData.status,
      });
    } else {
      setFormData({ name: '', description: '', status: 'ACTIVE' });
    }
  }, [initialData, isOpen]);

  const handleClose = () => {
    setFormData({ name: '', description: '', status: 'ACTIVE' });
    onClose();
  };

  const handleSubmit = () => {
    if (isEditMode) {
      onSubmit({
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });
    } else {
      onSubmit({
        name: formData.name,
        description: formData.description || undefined,
      });
    }
  };

  const isFormValid = formData.name.trim();

  return (
    <Modal
      backdrop="blur"
      className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
      isOpen={isOpen}
      onOpenChange={handleClose}
    >
      <ModalContent>
        <ModalHeader>
          {isEditMode ? 'Edit Modifier Category' : 'Create Modifier Category'}
        </ModalHeader>
        <ModalBody className="p-4">
          <div className={isEditMode ? 'flex flex-col gap-4' : 'space-y-4'}>
            <Input
              isRequired
              label="Name"
              labelPlacement={isEditMode ? undefined : 'outside-top'}
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
              autoComplete="off"
              classNames={{
                inputWrapper:
                  'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                input: 'text-text group-data-[has-value=true]:text-text',
                label: 'text-text text-sm',
              }}
            />
            <Input
              label="Description"
              labelPlacement={isEditMode ? undefined : 'outside-top'}
              value={formData.description}
              onValueChange={(value) => setFormData({ ...formData, description: value })}
              autoComplete="off"
              classNames={{
                inputWrapper:
                  'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                input: 'text-text group-data-[has-value=true]:text-text',
                label: 'text-text text-sm',
              }}
            />
            {isEditMode && initialData?.status !== 'PENDING' && (
              <SelectWithClassName
                label="Status"
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(e) => setFormData({ ...formData, status: e.currentKey || '' })}
                selectorIconColor="text-text"
                classNames={{
                  trigger: 'bg-backgroundSecondary data-[open=true]:border-border',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                }}
              >
                <SelectItem key="ACTIVE" textValue="ACTIVE">
                  Active
                </SelectItem>
                <SelectItem key="INACTIVE" textValue="INACTIVE">
                  Inactive
                </SelectItem>
              </SelectWithClassName>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {isAdmin && (
            <Button
              variant="solid"
              color="primary"
              className={`w-fit ml-auto ${!isFormValid ? 'bg-secondary cursor-not-allowed' : ''}`}
              onPress={handleSubmit}
              disabled={!isFormValid}
              isLoading={isLoading}
            >
              {isEditMode ? 'Update Modifier Category' : 'Create Modifier Category'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
