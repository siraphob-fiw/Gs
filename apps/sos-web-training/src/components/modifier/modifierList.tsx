'use client';

import React, { useState, useCallback } from 'react';
import { addToast, Tab, Tabs } from '@heroui/react';
import {
  useModifiers,
  useModifierCategories,
  useBulkUpdateModifier,
  Modifier,
  ModifierCategory,
  CreateModifierDto,
  CreateModifierCategoryDto,
  BulkUpdateModifierDto,
} from '@/hooks/api/use-modifier';
import { useModifierActions } from '@/hooks/api/use-modifier-actions';
import useRoleAccess from '@/hooks/api/use-role-access';
import ConfirmationModal from '../forms/ConfirmationModal';
import {
  ModifierFormModal,
  ModifierViewModal,
  CategoryFormModal,
  ModifierListTab,
  ModifierCategoryListTab,
  ImportModifierModal,
} from '.';
import { CategoryViewModal } from './CategoryViewModal';

// Types for modal states
interface ApproveModalState {
  id: string;
  type: 'modifier' | 'category';
}

interface EditModifierState {
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
}

interface EditCategoryState {
  id: string;
  name: string;
  description: string;
  status: string;
}

export default function ModifierList({ effectiveTenantId }: { effectiveTenantId: string }) {
  const { isAdmin } = useRoleAccess();

  // Data fetching
  const {
    data: modifierData,
    isLoading: isLoadingModifiers,
    refetch: refetchModifiers,
  } = useModifiers({ page: 1, limit: 1000, tenantId: effectiveTenantId });

  const {
    data: modifierCategoryData,
    isLoading: isLoadingModifierCategories,
    refetch: refetchModifierCategories,
  } = useModifierCategories({ page: 1, limit: 1000, tenantId: effectiveTenantId });

  // Actions hook
  const actions = useModifierActions({
    onModifierSuccess: refetchModifiers,
    onCategorySuccess: () => {
      refetchModifierCategories();
      refetchModifiers();
    },
    tenantId: effectiveTenantId,
  });

  // Bulk create mutation
  const bulkUpdateModifierMutation = useBulkUpdateModifier();

  // Modal states
  const [createModifierModal, setCreateModifierModal] = useState(false);
  const [createCategoryModal, setCreateCategoryModal] = useState(false);
  const [importModifierModal, setImportModifierModal] = useState(false);
  const [editModifier, setEditModifier] = useState<EditModifierState | null>(null);
  const [viewModifier, setViewModifier] = useState<Modifier | null>(null);
  const [viewCategoey, setViewCategory] = useState<ModifierCategory | null>(null);
  const [editCategory, setEditCategory] = useState<EditCategoryState | null>(null);
  const [deleteModifierId, setDeleteModifierId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<ApproveModalState | null>(null);

  // Handlers for Modifiers
  const handleCreateModifier = useCallback(
    (data: CreateModifierDto) => {
      actions.createModifier(data, {
        onSuccess: () => setCreateModifierModal(false),
      });
    },
    [actions],
  );

  const handleUpdateModifier = useCallback(
    (data: any) => {
      if (!editModifier) return;
      actions.updateModifier(editModifier.id, data, {
        onSuccess: () => setEditModifier(null),
      });
    },
    [actions, editModifier],
  );

  const handleDeleteModifier = useCallback(() => {
    if (!deleteModifierId) return;
    actions.deleteModifier(deleteModifierId, {
      onSuccess: () => setDeleteModifierId(null),
    });
  }, [actions, deleteModifierId]);

  const handleEditModifierClick = useCallback((modifier: Modifier) => {
    setEditModifier({
      id: modifier.id,
      name: modifier.name,
      modifier_category_id: modifier.modifier_category_id,
      central_stress_factor: modifier.central_stress_factor,
      peripheral_stress_factor: modifier.peripheral_stress_factor,
      status: modifier.status,
      cs_base_multiplier: modifier.cs_base_multiplier,
      cs_cluster_increment: modifier.cs_cluster_increment,
      ps_base_multiplier: modifier.ps_base_multiplier,
      ps_cluster_increment: modifier.ps_cluster_increment,
      uses_cluster_calculation: modifier.uses_cluster_calculation,
    });
  }, []);

  const handleViewModifierClick = useCallback((modifier: Modifier) => {
    setViewModifier(modifier);
  }, []);

   const handleViewCategoryClick = useCallback((modifier: Modifier) => {
    setViewCategory(modifier);
  }, []);

  const handleBulkImport = useCallback(
    async (modifiersToImport: BulkUpdateModifierDto[]) => {
      const res = await bulkUpdateModifierMutation.mutateAsync({
        modifiers: modifiersToImport,
        tenantId: effectiveTenantId,
      });
      if (res.failed > 0) {
        console.error(res.errors);
        addToast({
          title: 'Failed to import modifiers',
          color: 'danger',
          variant: 'solid',
          description: (
            <div>
              <p>Failed: {res.failed} modifiers</p>
            </div>
          ),
        });
      } else {
        addToast({
          title: 'Modifiers imported successfully',
          color: 'success',
          variant: 'solid',
          description: (
            <div>
              <p>Updated: {res.updated} modifiers</p>
              <p>Created: {res.created} modifiers</p>
            </div>
          ),
        });
      }
      refetchModifiers();
    },
    [bulkUpdateModifierMutation, refetchModifiers],
  );

  // Handlers for Categories
  const handleCreateCategory = useCallback(
    (data: CreateModifierCategoryDto) => {
      actions.createCategory(data, {
        onSuccess: () => setCreateCategoryModal(false),
      });
    },
    [actions],
  );

  const handleUpdateCategory = useCallback(
    (data: any) => {
      if (!editCategory) return;
      actions.updateCategory(editCategory.id, data, {
        onSuccess: () => setEditCategory(null),
      });
    },
    [actions, editCategory],
  );

  const handleDeleteCategory = useCallback(() => {
    if (!deleteCategoryId) return;
    actions.deleteCategory(deleteCategoryId, {
      onSuccess: () => setDeleteCategoryId(null),
    });
  }, [actions, deleteCategoryId]);

  const handleEditCategoryClick = useCallback((category: ModifierCategory) => {
    setEditCategory({
      id: category.id,
      name: category.name,
      description: category.description || '',
      status: category.status,
    });
  }, []);

  // Approve handler
  const handleApprove = useCallback(() => {
    if (!approveModal) return;

    if (approveModal.type === 'modifier') {
      actions.approveModifier(approveModal.id);
    } else {
      actions.approveCategory(approveModal.id);
    }
    setApproveModal(null);
  }, [actions, approveModal]);

  // Data
  const modifiers = modifierData?.modifiers ?? [];
  const categories = modifierCategoryData?.modifier_categories ?? [];

  return (
    <div>
      <Tabs
        classNames={{ tabContent: 'text-text group-data-[selected=true]:text-white' }}
        variant="bordered"
        color="primary"
      >
        <Tab key="list" title="List Modifiers">
          <ModifierListTab
            modifiers={modifiers}
            categories={categories}
            isLoading={isLoadingModifiers}
            isAdmin={isAdmin()}
            onRefresh={refetchModifiers}
            onCreateClick={() => setCreateModifierModal(true)}
            onEditClick={handleEditModifierClick}
            onViewClick={handleViewModifierClick}
            onDeleteClick={setDeleteModifierId}
            onApproveClick={(id) => setApproveModal({ id, type: 'modifier' })}
            onImportClick={() => setImportModifierModal(true)}
          />
        </Tab>

        <Tab key="categories" title="List Modifier Categories">
          <ModifierCategoryListTab
            categories={categories}
            isLoading={isLoadingModifierCategories}
            isAdmin={isAdmin()}
            onRefresh={refetchModifierCategories}
            onCreateClick={() => setCreateCategoryModal(true)}
            onEditClick={handleEditCategoryClick}
            onDeleteClick={setDeleteCategoryId}
            onApproveClick={(id) => setApproveModal({ id, type: 'category' })}
            onViewClick={handleViewCategoryClick}
          />
        </Tab>
      </Tabs>

      {/* Modifier Modals */}
      <ModifierFormModal
        isOpen={createModifierModal}
        onClose={() => setCreateModifierModal(false)}
        onSubmit={handleCreateModifier}
        categories={categories}
        isAdmin={isAdmin()}
        isLoading={actions.isCreatingModifier}
      />

      <ModifierFormModal
        isOpen={!!editModifier}
        onClose={() => setEditModifier(null)}
        onSubmit={handleUpdateModifier}
        categories={categories}
        initialData={editModifier ?? undefined}
        isAdmin={isAdmin()}
        isLoading={actions.isUpdatingModifier}
      />

      {/* View Modifier Modal (for coaches) */}
      <ModifierViewModal
        isOpen={!!viewModifier}
        onClose={() => setViewModifier(null)}
        modifier={viewModifier}
        category={categories.find((c) => c.id === viewModifier?.modifier_category_id)}
      />

      <CategoryViewModal
        isOpen={!!viewCategoey}
        onClose={() => setViewCategory(null)}
        category={viewCategoey}
      />

      {/* Import Modifier Modal */}
      <ImportModifierModal
        isOpen={importModifierModal}
        onClose={() => setImportModifierModal(false)}
        onImport={handleBulkImport}
        categories={categories}
      />

      {/* Category Modals */}
      <CategoryFormModal
        isOpen={createCategoryModal}
        onClose={() => setCreateCategoryModal(false)}
        onSubmit={handleCreateCategory}
        isAdmin={isAdmin()}
        isLoading={actions.isCreatingCategory}
      />

      <CategoryFormModal
        isOpen={!!editCategory}
        onClose={() => setEditCategory(null)}
        onSubmit={handleUpdateCategory}
        initialData={editCategory ?? undefined}
        isAdmin={isAdmin()}
        isLoading={actions.isUpdatingCategory}
      />

      {/* Delete Confirmation Modals */}
      <ConfirmationModal
        isOpen={deleteCategoryId !== null}
        onClose={() => setDeleteCategoryId(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Modifier Category"
        message="All modifiers in this category will be deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={actions.isDeletingCategory}
      />

      <ConfirmationModal
        isOpen={deleteModifierId !== null}
        onClose={() => setDeleteModifierId(null)}
        onConfirm={handleDeleteModifier}
        title="Delete Modifier"
        message="This modifier will be deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={actions.isDeletingModifier}
      />

      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        isOpen={approveModal !== null}
        onClose={() => setApproveModal(null)}
        onConfirm={handleApprove}
        title={approveModal?.type === 'modifier' ? 'Approve Modifier' : 'Approve Modifier Category'}
        message={
          approveModal?.type === 'modifier'
            ? 'This modifier will be approved. This action cannot be undone.'
            : 'This modifier category will be approved. This action cannot be undone.'
        }
        confirmText="Approve"
        cancelText="Cancel"
        confirmVariant="success"
      />
    </div>
  );
}
