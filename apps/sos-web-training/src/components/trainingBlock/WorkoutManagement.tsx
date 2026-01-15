'use client';

import React, { useCallback, useState, useMemo, useEffect, memo } from 'react';
import {
  addToast,
  Button,
  Card,
  CardBody,
  DropdownItem,
  Dropdown,
  Input,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  DropdownTrigger,
  DropdownMenu,
} from '@heroui/react';
import { useDuplicateTrainingBlock, useTrainingBlocks } from '@/hooks/api/use-training-blocks';
import { TrainingBlockResponse } from '@/types/global';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import { FaPlus } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useDeleteTrainingBlock } from '@/hooks/api/use-training-blocks';
import { useIsMobile } from '@/hooks/api/use-screen-utils';
import ConfirmationModal from '../forms/ConfirmationModal';
import { FaEllipsis } from 'react-icons/fa6';
import { useAuth } from '@/hooks/api/use-auth-hooks';
import useRoleAccess from '@/hooks/api/use-role-access';

const LoadingSpinner = memo(({ text }: { text: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info" />
    <span className="ml-2 text-text">{text}</span>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

interface TableListTrainingBlocksProps {
  isAdmin?: boolean;
  blocks: TrainingBlockResponse[];
  global?: boolean;
  ableToCreate: boolean;
  abletoCopy: boolean;
  ableToEdit: boolean;
  ableToDelete: boolean;
  tenantId?: string;
}

// Memo table for optimal renders
const TableListTrainingBlocks = memo(
  ({
    isAdmin = false,
    blocks,
    global = false,
    ableToCreate = false,
    abletoCopy = false,
    ableToEdit = false,
    ableToDelete = false,
    tenantId,
  }: TableListTrainingBlocksProps) => {
    const { state } = useAuth();
    const user = state.user;
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [blockToDelete, setBlockToDelete] = useState<{ id: string; name: string } | null>(null);
    const isMobile = useIsMobile();
    const duplicateTrainingBlockMutation = useDuplicateTrainingBlock();
    const deleteTrainingBlockMutation = useDeleteTrainingBlock();

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearch(search);
      }, 300);
      return () => clearTimeout(timer);
    }, [search]);

    const filteredBlocks = useMemo(() => {
      if (!debouncedSearch) return blocks;
      const searchLower = debouncedSearch.toLowerCase();
      return blocks.filter((block) => block.workoutName.toLowerCase().includes(searchLower));
    }, [blocks, debouncedSearch]);

    const handleDuplicateTrainingBlock = useCallback(
      (id: string) =>
        duplicateTrainingBlockMutation.mutate(
          { id, tenantId },
          {
            onSuccess: () => {
              addToast({ title: 'Training block duplicated successfully', color: 'success' });
            },
            onError: () => {
              addToast({ title: 'Failed to duplicate training block', color: 'danger' });
            },
          },
        ),
      [duplicateTrainingBlockMutation, tenantId],
    );

    const handleDeleteClick = useCallback((id: string, name: string) => {
      setBlockToDelete({ id, name });
      setIsDeleteModalOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(() => {
      if (!blockToDelete) return;
      deleteTrainingBlockMutation.mutate(
        { id: blockToDelete.id, tenantId },
        {
          onSuccess: () => {
            addToast({ title: 'Training block deleted successfully', color: 'success' });
            setIsDeleteModalOpen(false);
            setBlockToDelete(null);
          },
          onError: () => {
            addToast({ title: 'Failed to delete training block', color: 'danger' });
          },
        },
      );
    }, [blockToDelete, deleteTrainingBlockMutation, tenantId]);

    const handleCloseDeleteModal = useCallback(() => {
      setIsDeleteModalOpen(false);
      setBlockToDelete(null);
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    }, []);

    const filterBlock = useMemo(
      () => (
        <div
          className={`flex items-center gap-4 ${ableToCreate ? 'justify-between' : 'justify-end'}`}
        >
          {ableToCreate && (
            <Button
              variant="solid"
              color="primary"
              onPress={() => {
                const params = new URLSearchParams();
                if (tenantId) params.append('tenantId', tenantId);
                const queryString = params.toString();
                router.push(`/workout/manage-workouts/add${queryString ? `?${queryString}` : ''}`);
              }}
              className="flex items-center"
              startContent={<FaPlus />}
            >
              <span>Create Program</span>
            </Button>
          )}
          <Input
            label="Search"
            placeholder="Search training blocks..."
            variant="bordered"
            size="sm"
            value={search}
            onChange={handleSearchChange}
            classNames={{
              base: 'w-1/3 max-w-xs',
              inputWrapper: 'bg-backgroundSecondary group-data-[focus=true]:border-border',
              input: 'text-text',
            }}
          />
        </div>
      ),
      [search, handleSearchChange, global, tenantId, ableToCreate, router],
    );

    if (blocks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center text-text">
          <HiOutlineLightningBolt className="w-12 h-12 mx-auto text-text" />
          <h3 className="text-lg font-medium text-text mb-2">No Programs Available</h3>
          <p className="text-text">
            {global ? 'No global programs found.' : 'Create your first program to get started.'}
          </p>
          {ableToCreate && (
            <Button
              variant="solid"
              color="primary"
              onPress={() => {
                const params = new URLSearchParams();
                if (tenantId) params.append('tenantId', tenantId);
                const queryString = params.toString();
                router.push(`/workout/manage-workouts/add${queryString ? `?${queryString}` : ''}`);
              }}
            >
              Create Program
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        <Table
          aria-label="List Training Blocks"
          removeWrapper
          classNames={{
            th: 'bg-background text-text text-sm font-medium',
            td: 'text-text',
          }}
          topContent={filterBlock}
        >
          <TableHeader>
            <TableColumn className="text-center" style={{ width: '1%', whiteSpace: 'nowrap' }}>
              #
            </TableColumn>
            <TableColumn>Workout Name</TableColumn>
            <TableColumn>Created By</TableColumn>
            <TableColumn className="text-center" style={{ width: '20%', whiteSpace: 'nowrap' }}>
              Actions
            </TableColumn>
          </TableHeader>
          <TableBody>
            {filteredBlocks.map((block, index) => (
              <TableRow key={block.id}>
                <TableCell className="text-center font-medium">{index + 1}</TableCell>
                <TableCell>
                  <span className="font-medium line-clamp-1 text-ellipsis whitespace-nowrap">
                    {block.workoutName}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium line-clamp-1 text-ellipsis whitespace-nowrap">
                    {block.createdByName || '-'} {isAdmin && `(${block.tenantName})` }
                  </span>
                </TableCell>
                <TableCell className="text-center flex items-center gap-2 justify-center whitespace-nowrap">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant="solid" size="sm" color="primary" isIconOnly={isMobile}>
                        {!isMobile ? <span>Actions</span> : <FaEllipsis />}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Static Actions">
                      <DropdownItem
                        key="view"
                        onPress={() =>
                          router.push(
                            `/workout/manage-workouts/view?id=${block.id}${tenantId ? `&tenantId=${tenantId}` : ''}`,
                          )
                        }
                      >
                        View
                      </DropdownItem>
                      {!isAdmin && block.isGlobal !== true ? (
                        <DropdownItem
                          key="deploy"
                          onPress={() => router.push(`/workout/session/deploy?id=${block.id}`)}
                        >
                          Deploy
                        </DropdownItem>
                      ) : null}
                      {ableToEdit && user?.id === block.createdBy ? (
                        <DropdownItem
                          key="edit"
                          onPress={() =>
                            router.push(
                              `/workout/manage-workouts/edit?id=${block.id}${tenantId ? `&tenantId=${tenantId}` : ''}`,
                            )
                          }
                        >
                          Edit
                        </DropdownItem>
                      ) : null}
                      {abletoCopy ? (
                        <DropdownItem
                          key="duplicate"
                          onPress={() => handleDuplicateTrainingBlock(block.id)}
                        >
                          Duplicate
                        </DropdownItem>
                      ) : null}
                      {ableToDelete || (user?.id === block.createdBy && block.isGlobal !== true) ? (
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          onPress={() => handleDeleteClick(block.id, block.workoutName)}
                        >
                          Delete
                        </DropdownItem>
                      ) : null}
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title="Delete Training Block"
          message={`Are you sure you want to delete "${blockToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
          isLoading={deleteTrainingBlockMutation.isPending}
        />
      </>
    );
  },
);
TableListTrainingBlocks.displayName = 'TableListTrainingBlocks';

// Only use three props to be consistent and minimize render logic
export const WorkoutManagement = memo(
  ({
    ableToCreate = false,
    ableToEditCustom = false,
    ableToEditGlobal = false,
    ableToDelete = false,
    effectiveTenantId,
  }: {
    ableToCreate?: boolean;
    ableToCreateGlobal?: boolean;
    ableToEditCustom?: boolean;
    ableToEditGlobal?: boolean;
    ableToDelete?: boolean;
    effectiveTenantId?: string;
  }) => {
    const { isAdmin } = useRoleAccess();
    const { state } = useAuth();
    const user = state.user;
    const { data: trainingBlocksListData, isLoading: trainingBlocksListLoading } =
      useTrainingBlocks({ status: 'ACTIVE', tenantId: effectiveTenantId });
    const blocks = useMemo(
      () => trainingBlocksListData?.blocks || [],
      [trainingBlocksListData?.blocks],
    );
    const router = useRouter();

    return (
      <Card className="bg-backgroundSecondary border border-border">
        <CardBody className="flex flex-col gap-2">
          {trainingBlocksListLoading ? (
            <LoadingSpinner text="Loading Templates..." />
          ) : blocks.length ? (
            isAdmin() ? (
              <Tabs
                classNames={{ tabContent: 'text-text group-data-[selected=true]:text-white' }}
                variant="bordered"
                color="primary"
              >
                <Tab key="global" title="Global">
                  <TableListTrainingBlocks
                    blocks={blocks.filter(
                      (block) => block.isGlobal === true || block.createdBy === user?.id,
                    )}
                    global={true}
                    ableToCreate={ableToEditGlobal}
                    abletoCopy={ableToCreate}
                    ableToEdit={ableToEditGlobal ?? false}
                    ableToDelete={ableToDelete}
                    tenantId={effectiveTenantId}
                  />
                </Tab>
                <Tab key="custom" title="Custom">
                  <TableListTrainingBlocks
                    isAdmin={true}
                    blocks={blocks.filter((block) => block.isGlobal === false)}
                    ableToCreate={false}
                    abletoCopy={false}
                    ableToEdit={false}
                    ableToDelete={false}
                    tenantId={undefined}
                  />
                </Tab>
              </Tabs>
            ) : (
              <Tabs
                classNames={{ tabContent: 'text-text group-data-[selected=true]:text-white' }}
                variant="bordered"
                color="primary"
              >
                <Tab key="custom" title="Custom">
                  <TableListTrainingBlocks
                    blocks={blocks.filter((block) => block.isGlobal === false)}
                    ableToCreate={ableToCreate}
                    abletoCopy={ableToCreate}
                    ableToEdit={ableToEditCustom ?? false}
                    ableToDelete={ableToDelete}
                    tenantId={effectiveTenantId}
                  />
                </Tab>
                <Tab key="global" title="Global">
                  <TableListTrainingBlocks
                    blocks={blocks.filter((block) => block.isGlobal === true)}
                    global={true}
                    ableToCreate={ableToEditGlobal}
                    abletoCopy={ableToCreate}
                    ableToEdit={ableToEditGlobal ?? false}
                    ableToDelete={ableToDelete}
                    tenantId={effectiveTenantId}
                  />
                </Tab>
              </Tabs>
            )
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center text-text">
              <HiOutlineLightningBolt className="w-12 h-12 mx-auto text-text" />
              <h3 className="text-lg font-medium text-text mb-2">No List Templates</h3>
              <p className="text-text">Create your first template to get started.</p>
              {isAdmin() ? (
                <Button
                  variant="solid"
                  color="primary"
                  onPress={() =>
                    router.push(
                      `/workout/manage-workouts/add?global=true${effectiveTenantId ? `&tenantId=${effectiveTenantId}` : ''}`,
                    )
                  }
                >
                  Create Template
                </Button>
              ) : ableToCreate ? (
                <Button
                  variant="solid"
                  color="primary"
                  onPress={() =>
                    router.push(
                      `/workout/manage-workouts/add${effectiveTenantId ? `?tenantId=${effectiveTenantId}` : ''}`,
                    )
                  }
                >
                  Create Template
                </Button>
              ) : null}
            </div>
          )}
        </CardBody>
      </Card>
    );
  },
);
WorkoutManagement.displayName = 'WorkoutManagement';

export default WorkoutManagement;
