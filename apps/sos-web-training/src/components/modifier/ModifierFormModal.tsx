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
import { ModifierCategory, CreateModifierDto, EditModifierDto } from '@/hooks/api/use-modifier';

interface ModifierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateModifierDto | EditModifierDto) => void;
  categories: ModifierCategory[];
  initialData?: {
    id: string;
    name: string;
    modifier_category_id: string;
    central_stress_factor: number;
    peripheral_stress_factor: number;
    status: string;
    // Cluster-based stress modifier fields (for Set Style category)
    cs_base_multiplier?: number | null;
    cs_cluster_increment?: number | null;
    ps_base_multiplier?: number | null;
    ps_cluster_increment?: number | null;
    uses_cluster_calculation?: boolean;
  };
  isAdmin?: boolean;
  isLoading?: boolean;
}

export function ModifierFormModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
  isAdmin = true,
  isLoading = false,
}: ModifierFormModalProps) {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState<{
    name: string;
    modifier_category_id: string;
    status: string;
    central_stress_factor: number;
    peripheral_stress_factor: number;
    cs_base_multiplier: number | null;
    cs_cluster_increment: number | null;
    ps_base_multiplier: number | null;
    ps_cluster_increment: number | null;
  }>({
    name: '',
    modifier_category_id: '',
    status: 'ACTIVE',
    central_stress_factor: 0,
    peripheral_stress_factor: 0,
    cs_base_multiplier: null,
    cs_cluster_increment: null,
    ps_base_multiplier: null,
    ps_cluster_increment: null,
  });

  // Check if the selected category is "Set Style" (case-insensitive)
  const selectedCategory = categories.find((c) => c.id === formData.modifier_category_id);
  const isSetStyleCategory = selectedCategory?.name?.toLowerCase() === 'set style';

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        modifier_category_id: initialData.modifier_category_id,
        status: initialData.status,
        central_stress_factor: initialData.central_stress_factor,
        peripheral_stress_factor: initialData.peripheral_stress_factor,
        cs_base_multiplier: initialData.cs_base_multiplier ?? null,
        cs_cluster_increment: initialData.cs_cluster_increment ?? null,
        ps_base_multiplier: initialData.ps_base_multiplier ?? null,
        ps_cluster_increment: initialData.ps_cluster_increment ?? null,
      });
    } else {
      setFormData({
        name: '',
        modifier_category_id: '',
        central_stress_factor: 0,
        peripheral_stress_factor: 0,
        status: 'PENDING',
        cs_base_multiplier: null,
        cs_cluster_increment: null,
        ps_base_multiplier: null,
        ps_cluster_increment: null,
      });
    }
  }, [initialData, isOpen]);

  const handleClose = () => {
    setFormData({
      name: '',
      modifier_category_id: '',
      status: 'PENDING',
      central_stress_factor: 0,
      peripheral_stress_factor: 0,
      cs_base_multiplier: null,
      cs_cluster_increment: null,
      ps_base_multiplier: null,
      ps_cluster_increment: null,
    });
    onClose();
  };

  const handleSubmit = () => {
    // Build the base data
    const baseData = {
      name: formData.name,
      modifier_category_id: formData.modifier_category_id,
      central_stress_factor: formData.central_stress_factor,
      peripheral_stress_factor: formData.peripheral_stress_factor,
    };

    // Include cluster fields if category is "Set Style"
    const clusterData = isSetStyleCategory
      ? {
          cs_base_multiplier: formData.cs_base_multiplier,
          cs_cluster_increment: formData.cs_cluster_increment,
          ps_base_multiplier: formData.ps_base_multiplier,
          ps_cluster_increment: formData.ps_cluster_increment,
          uses_cluster_calculation: true,
        }
      : {
          cs_base_multiplier: null,
          cs_cluster_increment: null,
          ps_base_multiplier: null,
          ps_cluster_increment: null,
          uses_cluster_calculation: false,
        };

    if (isEditMode) {
      onSubmit({
        ...baseData,
        ...clusterData,
        status: formData.status,
      });
    } else {
      onSubmit({
        ...baseData,
        ...clusterData,
      });
    }
  };

  const isFormValid = formData.name.trim() && formData.modifier_category_id;
  const activeCategories = categories.filter((c) => c.status === 'ACTIVE');

  return (
    <Modal
      backdrop="blur"
      className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
      isOpen={isOpen}
      onOpenChange={handleClose}
    >
      <ModalContent>
        <ModalHeader>{isEditMode ? 'Edit Modifier' : 'Create Modifier'}</ModalHeader>
        <ModalBody className="p-4 flex flex-col gap-4">
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
          <SelectWithClassName
            isRequired={!isEditMode}
            label="Modifier Category"
            labelPlacement={isEditMode ? undefined : 'outside'}
            placeholder="Select..."
            selectedKeys={formData.modifier_category_id ? [formData.modifier_category_id] : []}
            onSelectionChange={(e) =>
              setFormData({ ...formData, modifier_category_id: e.currentKey || '' })
            }
            selectorIconColor="text-text"
            classNames={{
              trigger:
                'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
              value: 'text-text group-data-[has-value=true]:text-text',
              listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
              label: 'text-text text-sm group-data-[filled=true]:text-text',
            }}
          >
            {(isEditMode ? categories : activeCategories).map((category) => (
              <SelectItem key={category.id} textValue={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectWithClassName>

          {isEditMode && (
            <SelectWithClassName
              label="Status"
              selectedKeys={formData.status ? [formData.status] : []}
              onSelectionChange={(e) => setFormData({ ...formData, status: e.currentKey || '' })}
              selectorIconColor="text-text"
              classNames={{
                trigger:
                  'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                value: 'text-text group-data-[has-value=true]:text-text',
                listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
              }}
            >
              <SelectItem key="ACTIVE" textValue="ACTIVE">
                Active
              </SelectItem>
              <SelectItem key="INACTIVE" textValue="INACTIVE">
                Inactive
              </SelectItem>
              <SelectItem key="PENDING" textValue="PENDING">
                Pending
              </SelectItem>
            </SelectWithClassName>
          )}

          <Input
            label="Central Stress Factor"
            labelPlacement="outside-top"
            value={formData.central_stress_factor.toString()}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                central_stress_factor: parseFloat(value),
              })
            }
            autoComplete="off"
            classNames={{
              inputWrapper:
                'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
            }}
            type="number"
            min="-10.0"
            max="10.0"
            step="0.1"
          />

          <Input
            label="Peripheral Stress Factor"
            labelPlacement="outside-top"
            value={formData.peripheral_stress_factor.toString()}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                peripheral_stress_factor: parseFloat(value),
              })
            }
            autoComplete="off"
            classNames={{
              inputWrapper:
                'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
            }}
            type="number"
            min="-10.0"
            max="10.0"
            step="0.1"
          />

          {/* Cluster-based stress modifier fields (only shown for "Set Style" category) */}
          {isSetStyleCategory && (
            <>
              <div className="mt-2 mb-2">
                <p className="text-sm font-medium text-text">Set Style Multipliers</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="CS Base Multiplier"
                  labelPlacement="outside-top"
                  value={formData.cs_base_multiplier?.toString() ?? ''}
                  placeholder="e.g., 1.10"
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      cs_base_multiplier: value ? parseFloat(value) : null,
                    })
                  }
                  autoComplete="off"
                  classNames={{
                    inputWrapper:
                      'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                    label: 'text-text text-xs',
                  }}
                  type="number"
                  step="0.01"
                />

                <Input
                  label="CS Cluster Increment"
                  labelPlacement="outside-top"
                  value={formData.cs_cluster_increment?.toString() ?? ''}
                  placeholder="e.g., 0.02"
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      cs_cluster_increment: value ? parseFloat(value) : null,
                    })
                  }
                  autoComplete="off"
                  classNames={{
                    inputWrapper:
                      'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                    label: 'text-text text-xs',
                  }}
                  type="number"
                  step="0.01"
                />

                <Input
                  label="PS Base Multiplier"
                  labelPlacement="outside-top"
                  value={formData.ps_base_multiplier?.toString() ?? ''}
                  placeholder="e.g., 1.25"
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      ps_base_multiplier: value ? parseFloat(value) : null,
                    })
                  }
                  autoComplete="off"
                  classNames={{
                    inputWrapper:
                      'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                    label: 'text-text text-xs',
                  }}
                  type="number"
                  step="0.01"
                />

                <Input
                  label="PS Cluster Increment"
                  labelPlacement="outside-top"
                  value={formData.ps_cluster_increment?.toString() ?? ''}
                  placeholder="e.g., 0.05"
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      ps_cluster_increment: value ? parseFloat(value) : null,
                    })
                  }
                  autoComplete="off"
                  classNames={{
                    inputWrapper:
                      'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                    label: 'text-text text-xs',
                  }}
                  type="number"
                  step="0.01"
                />
              </div>
            </>
          )}
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
              {isEditMode ? 'Update Modifier' : 'Create Modifier'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
