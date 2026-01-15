'use client';

import { addToast } from '@heroui/react';
import {
  useCreateModifier,
  useCreateModifierCategory,
  useUpdateModifier,
  useUpdateModifierCategory,
  useDeleteModifier,
  useDeleteModifierCategory,
  CreateModifierDto,
  CreateModifierCategoryDto,
  EditModifierDto,
  EditModifierCategoryDto,
} from '@/hooks/api/use-modifier';

interface UseModifierActionsOptions {
  onModifierSuccess?: () => void;
  onCategorySuccess?: () => void;
  tenantId?: string;
}

export function useModifierActions(options: UseModifierActionsOptions = {}) {
  const { onModifierSuccess, onCategorySuccess, tenantId } = options;

  const createModifierMutation = useCreateModifier();
  const updateModifierMutation = useUpdateModifier();
  const deleteModifierMutation = useDeleteModifier();
  const createCategoryMutation = useCreateModifierCategory();
  const updateCategoryMutation = useUpdateModifierCategory();
  const deleteCategoryMutation = useDeleteModifierCategory();

  const createModifier = (data: CreateModifierDto, callbacks?: { onSuccess?: () => void }) => {
    if (!data.name.trim()) return;

    createModifierMutation.mutate(
      { ...data, tenantId },
      {
        onSuccess: () => {
          addToast({
            title: 'Modifier created successfully',
            color: 'success',
          });
          callbacks?.onSuccess?.();
          onModifierSuccess?.();
        },
        onError: (error: any) => {
          addToast({
            title: 'Error creating modifier',
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      },
    );
  };

  const updateModifier = (
    id: string,
    data: EditModifierDto,
    callbacks?: { onSuccess?: () => void },
  ) => {
    updateModifierMutation.mutate(
      { id, data, tenantId },
      {
        onSuccess: () => {
          addToast({
            title: 'Modifier updated successfully',
            variant: 'solid',
            color: 'success',
          });
          callbacks?.onSuccess?.();
          onModifierSuccess?.();
        },
        onError: (error: any) => {
          addToast({
            title: 'Error updating modifier',
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      },
    );
  };

  const deleteModifier = (id: string, callbacks?: { onSuccess?: () => void }) => {
    deleteModifierMutation.mutate(
      { id, tenantId },
      {
        onSuccess: () => {
          addToast({
            title: 'Modifier deleted successfully',
            variant: 'solid',
            color: 'success',
          });
          callbacks?.onSuccess?.();
          onModifierSuccess?.();
        },
        onError: (error: any) => {
          addToast({
            title: 'Error deleting modifier',
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      },
    );
  };

  const approveModifier = (id: string, callbacks?: { onSuccess?: () => void }) => {
    updateModifierMutation.mutate(
      { id, data: { status: 'ACTIVE' }, tenantId },
      {
        onSuccess: () => {
          addToast({
            title: 'Modifier approved successfully',
            variant: 'solid',
            color: 'success',
          });
          callbacks?.onSuccess?.();
          onModifierSuccess?.();
        },
        onError: (error: any) => {
          addToast({
            title: 'Error approving modifier',
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      },
    );
  };

  const createCategory = (
    data: CreateModifierCategoryDto,
    callbacks?: { onSuccess?: () => void },
  ) => {
    if (!data.name.trim()) return;

    createCategoryMutation.mutate(
      { ...data, tenantId },
      {
        onSuccess: () => {
          addToast({
            title: 'Modifier category created successfully',
            color: 'success',
          });
          callbacks?.onSuccess?.();
          onCategorySuccess?.();
        },
        onError: (error: any) => {
          addToast({
            title: 'Error creating modifier category',
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      },
    );
  };

  const updateCategory = (
    id: string,
    data: Partial<EditModifierCategoryDto>,
    callbacks?: { onSuccess?: () => void },
  ) => {
    updateCategoryMutation.mutate(
      { id, data, tenantId },
      {
        onSuccess: () => {
          addToast({
            title: 'Modifier category updated successfully',
            variant: 'solid',
            color: 'success',
          });
          callbacks?.onSuccess?.();
          onCategorySuccess?.();
        },
        onError: (error: any) => {
          addToast({
            title: 'Error updating modifier category',
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      },
    );
  };

  const deleteCategory = (id: string, callbacks?: { onSuccess?: () => void }) => {
    deleteCategoryMutation.mutate(
      { id, tenantId },
      {
        onSuccess: () => {
          addToast({
            title: 'Modifier category deleted successfully',
            variant: 'solid',
            color: 'success',
          });
          callbacks?.onSuccess?.();
          onCategorySuccess?.();
        },
        onError: (error: any) => {
          addToast({
            title: 'Error deleting modifier category',
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      },
    );
  };

  const approveCategory = (id: string, callbacks?: { onSuccess?: () => void }) => {
    updateCategoryMutation.mutate(
      { id, data: { status: 'ACTIVE' }, tenantId },
      {
        onSuccess: () => {
          addToast({
            title: 'Modifier category approved successfully',
            variant: 'solid',
            color: 'success',
          });
          callbacks?.onSuccess?.();
          onCategorySuccess?.();
        },
        onError: (error: any) => {
          addToast({
            title: 'Error approving modifier category',
            description: error?.message ?? 'Unknown error',
            variant: 'solid',
            color: 'danger',
          });
        },
      },
    );
  };

  return {
    // Modifier actions
    createModifier,
    updateModifier,
    deleteModifier,
    approveModifier,
    // Category actions
    createCategory,
    updateCategory,
    deleteCategory,
    approveCategory,
    // Loading states
    isCreatingModifier: createModifierMutation.isPending,
    isUpdatingModifier: updateModifierMutation.isPending,
    isDeletingModifier: deleteModifierMutation.isPending,
    isCreatingCategory: createCategoryMutation.isPending,
    isUpdatingCategory: updateCategoryMutation.isPending,
    isDeletingCategory: deleteCategoryMutation.isPending,
  };
}
