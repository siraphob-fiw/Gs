'use client';

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  addToast,
  Pagination,
  DrawerContent,
  Drawer,
  DrawerHeader,
  DrawerBody,
  SelectItem,
  SortDescriptor,
  Tab,
  Tabs,
} from '@heroui/react';
import { useState, useCallback, useMemo, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout/PageWrapper';
import {
  useExerciseCategories,
  useIsMobile,
  useRoleAccess,
  useExercises,
  useCreateExercise,
  useDeleteExercise,
  useUpdateExercise,
  useApproveExercise,
  useBulkCreateExercise,
  exerciseKeys,
  useCreateExerciseCategory,
  useUpdateExerciseCategory,
  useDeleteExerciseCategory,
  CreateExerciseCategoryRequest,
  UpdateExerciseCategoryRequest,
  ExerciseCategoryFilters,
  exerciseCategoryKeys,
} from '@/hooks/api';
import {
  CreateExerciseRequest,
  ExerciseFilters,
  ExerciseListResponse,
  UpdateExerciseRequest,
} from '@strengthos/shared-types';
import { ExerciseList } from '@/components/exercises/ExerciseList';
import { ExerciseCategoryList } from '@/components/exercises/ExerciseCategoryList';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { ExerciseForm } from '@/components/forms/ExerciseForm';
import { ExerciseCategoryForm } from '@/components/forms/ExerciseCategoryForm';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { ConfirmationModal } from '@/components/forms/ConfirmationModal';
import { LuImport } from 'react-icons/lu';
import { ModeSwitch } from '@/components/exercises/ModeSwitch';
import { ExerciseFiltersSection } from '@/components/exercises/ExerciseFilters';
import { ImportExerciseModal } from '@/components/exercises/ImportExerciseModal';
import { validateExercise } from '@/utils/exercise-validation';

export const initialExercise: CreateExerciseRequest = {
  name: '',
  exerciseType: '',
  movementPatterns: [],
  bodyPartFocus: [],
  disciplineTags: [],
  centralStressFactor: 0.1,
  peripheralStressFactor: 0.1,
  injuryContraindications: [],
  popularityScore: 0,
  effectivenessRating: 0,
  techniqueComplexity: 1,
  experienceLevel: 'BEGINNER',
  needEquipment: [],
};

export default function ManageExercisesPage() {
  const { isAdmin } = useRoleAccess();

  const [filters, setFilters] = useState<ExerciseFilters>({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const [exerciseCategoryFilters, setExerciseCategoryFilters] = useState<ExerciseCategoryFilters>({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const queryClient = useQueryClient();

  const { data: exercisesData, isLoading } = useExercises(filters) as unknown as {
    data: ExerciseListResponse;
    isLoading: boolean;
  };

  const { data: exerciseCategoriesData, isLoading: isLoadingExerciseCategories } =
    useExerciseCategories(exerciseCategoryFilters);
  const createExerciseMutation = useCreateExercise();
  const updateExerciseMutation = useUpdateExercise();
  const deleteExerciseMutation = useDeleteExercise();
  const bulkCreateExerciseMutation = useBulkCreateExercise();
  const approveExerciseMutation = useApproveExercise();

  // Exercise Category mutations
  const createExerciseCategoryMutation = useCreateExerciseCategory();
  const updateExerciseCategoryMutation = useUpdateExerciseCategory();
  const deleteExerciseCategoryMutation = useDeleteExerciseCategory();

  const [isCreateExerciseOpen, setIsCreateExerciseOpen] = useState(false);
  const [exerciseDrawer, setExerciseDrawer] = useState<{ open: boolean; type: 'edit' | 'view' }>({
    open: false,
    type: 'edit',
  });
  const [editExerciseData, setEditExerciseData] = useState<UpdateExerciseRequest | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<string>('');
  const [isConfirmApproveDialogOpen, setIsConfirmApproveDialogOpen] = useState<string>('');
  const [mode, setMode] = useState<'table' | 'card'>('table');
  const [isImportExerciseOpen, setIsImportExerciseOpen] = useState(false);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending',
  });

  // Exercise Category state
  const [isCreateExerciseCategoryOpen, setIsCreateExerciseCategoryOpen] = useState(false);
  const [exerciseCategoryDrawer, setExerciseCategoryDrawer] = useState<{
    open: boolean;
    type: 'edit' | 'view';
  }>({
    open: false,
    type: 'edit',
  });
  const [editExerciseCategoryData, setEditExerciseCategoryData] =
    useState<UpdateExerciseCategoryRequest | null>(null);
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
  const [isConfirmCategoryDeleteOpen, setIsConfirmCategoryDeleteOpen] = useState<string>('');

  const isMobile = useIsMobile();

  const handleCategorySortChange = useCallback(
    (descriptor: SortDescriptor) => {
      setExerciseCategoryFilters((prev) => ({
        ...prev,
        sortBy: descriptor.column as 'name' | 'created_at',
        sortOrder: descriptor.direction === 'ascending' ? 'asc' : 'desc',
        page: 1,
      }));


      queryClient.invalidateQueries({
        queryKey: exerciseCategoryKeys.list(exerciseCategoryFilters),
      });
    },
    [exerciseCategoryFilters, queryClient],
  );

  const handleSortChange = useCallback(
    (descriptor: SortDescriptor) => {
      setSortDescriptor({
        column: descriptor.column as 'name' | 'exerciseType' | 'created_at',
        direction: descriptor.direction as 'ascending' | 'descending',
      });

      const sortByMap: Record<string, string> = {
        name: 'name',
        exerciseType: 'exerciseType',
        is_approved: 'is_approved',
        created_at: 'created_at',
      };

      const sortBy = sortByMap[descriptor.column as string] || 'name';
      const sortOrder = descriptor.direction as 'ascending' | 'descending';

      setFilters((prevFilters) => {
        const newFilters = {
          ...prevFilters,
          sortBy: sortBy as 'name' | 'exerciseType' | 'created_at',
          sortOrder: sortOrder === 'ascending' ? 'asc' : 'desc',
          page: 1,
        } as ExerciseFilters;

        queryClient.invalidateQueries({
          queryKey: exerciseKeys.list(newFilters),
        });

        return newFilters;
      });
    },
    [queryClient],
  );

  const handleCreateExercise = useCallback(
    (newExercise: CreateExerciseRequest) => {
      const { isValid, errors: validationErrors } = validateExercise(newExercise);

      if (!isValid) {
        setErrors(validationErrors);
        return;
      }

      createExerciseMutation.mutate(newExercise, {
        onSuccess: () => {
          addToast({
            title: 'Exercise created successfully',
            color: 'success',
          });
          setIsCreateExerciseOpen(false);
          setErrors({});
        },
        onError: (error) => {
          addToast({
            title: 'Failed to create exercise',
            color: 'danger',
            description: error.message,
          });
          setErrors({});
        },
      });
    },
    [createExerciseMutation],
  );

  const handleEditExercise = useCallback(
    (exercise: UpdateExerciseRequest) => {
      const payload = {
        id: exercise.id,
        name: exercise.name,
        exerciseType: exercise.exerciseType,
        movementPatterns: exercise.movementPatterns,
        bodyPartFocus: exercise.bodyPartFocus,
        disciplineTags: exercise.disciplineTags,
        centralStressFactor: parseFloat(exercise.centralStressFactor?.toString() ?? '0'),
        peripheralStressFactor: parseFloat(exercise.peripheralStressFactor?.toString() || '0'),
        injuryContraindications: exercise.injuryContraindications,
        popularityScore: exercise.popularityScore,
        effectivenessRating: exercise.effectivenessRating,
        techniqueComplexity: exercise.techniqueComplexity,
        is_approved: exercise.is_approved,
        experienceLevel: exercise.experienceLevel,
      };

      const { isValid, errors: validationErrors } = validateExercise(payload);
      if (!isValid) {
        setErrors(validationErrors);
        return;
      }

      updateExerciseMutation.mutate(payload, {
        onSuccess: () => {
          addToast({
            title: 'Exercise updated successfully',
            color: 'success',
          });
          setErrors({});
          setEditExerciseData(null);
          setExerciseDrawer({ open: false, type: 'edit' });
        },
        onError: (error) => {
          addToast({
            title: 'Failed to update exercise',
            color: 'danger',
          });
          setErrors({});
          console.error('Failed to update exercise:', error);
        },
      });
    },
    [updateExerciseMutation],
  );

  const handleDeleteExercise = useCallback(
    async (exerciseId: string) => {
      try {
        await deleteExerciseMutation.mutateAsync(exerciseId);
        addToast({
          title: 'Exercise deleted successfully',
          color: 'success',
        });
        setErrors({});
      } catch (error) {
        addToast({
          title: 'Failed to delete exercise',
          color: 'danger',
        });
        setErrors({});
        console.error('Failed to delete exercise:', error);
      }
    },
    [deleteExerciseMutation],
  );

  const handleApproveExercise = useCallback(
    (exerciseId: string) => {
      approveExerciseMutation.mutate(exerciseId, {
        onSuccess: () => {
          addToast({
            title: 'Exercise approved successfully',
            color: 'success',
          });
          setIsConfirmApproveDialogOpen('');
        },
        onError: (error) => {
          addToast({
            title: 'Failed to approve exercise',
            color: 'danger',
          });
          setIsConfirmApproveDialogOpen('');
          console.error('Failed to approve exercise:', error);
        },
      });
    },
    [approveExerciseMutation],
  );

  const breadcrumbs = useMemo(
    () => [
      { label: 'Dashboard', href: isAdmin() ? '/admin' : '/dashboard' },
      { label: 'Exercises' },
    ],
    [isAdmin],
  );

  const title = useMemo(() => {
    return isAdmin() ? 'Manage Exercises' : 'Exercises';
  }, [isAdmin]);

  const handleBulkImport = useCallback(
    async (exercises: CreateExerciseRequest[]) => {
      bulkCreateExerciseMutation.mutate(
        { exercises: exercises },
        {
          onSuccess: () => {
            addToast({
              title: 'Exercises imported successfully',
              color: 'success',
            });
          },
          onError: (error) => {
            addToast({
              title: 'Failed to bulk create exercises',
              color: 'danger',
            });
            console.error('Failed to bulk create exercises:', error);
          },
        },
      );
    },
    [bulkCreateExerciseMutation],
  );

  const handleEditClick = useCallback((exercise: UpdateExerciseRequest) => {
    setEditExerciseData(exercise);
    setExerciseDrawer({ open: true, type: 'edit' });
  }, []);

  const handleViewClick = useCallback((exercise: UpdateExerciseRequest) => {
    setEditExerciseData(exercise);
    setExerciseDrawer({ open: true, type: 'view' });
  }, []);

  const handleDeleteClick = useCallback((exercise: { id: string }) => {
    setIsConfirmDialogOpen(exercise.id);
  }, []);

  const handleApproveClick = useCallback((id: string) => {
    setIsConfirmApproveDialogOpen(id);
  }, []);

  const handleModeChange = useCallback((value: boolean) => {
    setMode(value ? 'table' : 'card');
  }, []);

  // Exercise Category handlers
  const handleCreateExerciseCategory = useCallback(
    (newCategory: CreateExerciseCategoryRequest) => {
      if (!newCategory.name?.trim()) {
        setCategoryErrors({ name: 'Category name is required' });
        return;
      }

      createExerciseCategoryMutation.mutate(newCategory, {
        onSuccess: () => {
          addToast({
            title: 'Category created successfully',
            color: 'success',
          });
          setIsCreateExerciseCategoryOpen(false);
          setCategoryErrors({});
        },
        onError: (error) => {
          addToast({
            title: 'Failed to create category',
            color: 'danger',
            description: error.message,
          });
        },
      });
    },
    [createExerciseCategoryMutation],
  );

  const handleEditExerciseCategory = useCallback(
    (category: UpdateExerciseCategoryRequest) => {
      if (!category.name?.trim()) {
        setCategoryErrors({ name: 'Category name is required' });
        return;
      }

      updateExerciseCategoryMutation.mutate(category, {
        onSuccess: () => {
          addToast({
            title: 'Category updated successfully',
            color: 'success',
          });
          setCategoryErrors({});
          setEditExerciseCategoryData(null);
          setExerciseCategoryDrawer({ open: false, type: 'edit' });
        },
        onError: (error) => {
          addToast({
            title: 'Failed to update category',
            color: 'danger',
            description: error.message,
          });
        },
      });
    },
    [updateExerciseCategoryMutation],
  );

  const handleDeleteExerciseCategory = useCallback(
    async (categoryId: string) => {
      try {
        await deleteExerciseCategoryMutation.mutateAsync(categoryId);
        addToast({
          title: 'Category deleted successfully',
          color: 'success',
        });
      } catch (error) {
        addToast({
          title: 'Failed to delete category',
          color: 'danger',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
        console.error('Failed to delete category:', error);
      }
    },
    [deleteExerciseCategoryMutation],
  );

  const handleCategoryEditClick = useCallback((category: UpdateExerciseCategoryRequest) => {
    setEditExerciseCategoryData(category);
    setExerciseCategoryDrawer({ open: true, type: 'edit' });
  }, []);

  const handleCategoryViewClick = useCallback((category: UpdateExerciseCategoryRequest) => {
    setEditExerciseCategoryData(category);
    setExerciseCategoryDrawer({ open: true, type: 'view' });
  }, []);

  const handleCategoryDeleteClick = useCallback((category: { id: string }) => {
    setIsConfirmCategoryDeleteOpen(category.id);
  }, []);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info"></div>
        </div>
      }
    >
      <PageWrapper title={title} breadcrumbs={breadcrumbs}>
        <Card className="bg-backgroundSecondary border border-border">
          <CardBody>
            <Tabs
              classNames={{
                tabContent: 'text-text group-data-[selected=true]:text-white',
              }}
              variant="bordered"
              color="primary"
            >
              <Tab key="exercise" title="Exericse">
                <div className="space-y-4">
                  <ExerciseFiltersSection
                    filters={filters}
                    onFiltersChange={setFilters}
                    categories={exerciseCategoriesData?.exercise_categories || []}
                  />
                  <Card className="bg-background border border-border">
                    <CardHeader className="flex justify-between items-center gap-4">
                      <h3 className="text-lg font-medium text-text">Exercises</h3>
                      {isAdmin() && <div className="flex gap-2">
                        <Button
                          variant="solid"
                          color="primary"
                          onPress={() => setIsCreateExerciseOpen((prev) => !prev)}
                          disabled={createExerciseMutation.isPending}
                          isLoading={createExerciseMutation.isPending}
                        >
                          <FaPlus className="w-4 h-4" /> {!isMobile && 'Create'}
                        </Button>
                        <Button
                          variant="solid"
                          color="primary"
                          onPress={() => setIsImportExerciseOpen((prev) => !prev)}
                          disabled={bulkCreateExerciseMutation.isPending}
                          isLoading={bulkCreateExerciseMutation.isPending}
                        >
                          <LuImport className="w-4 h-4" /> {!isMobile && 'Import'}
                        </Button>
                      </div>}
                    </CardHeader>
                    <CardBody>
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center gap-4">
                            <SelectWithClassName
                              aria-label="Limit"
                              id="limit"
                              label="Limit"
                              labelPlacement="outside-left"
                              variant="bordered"
                              selectedKeys={filters.limit ? [filters.limit.toString()] : []}
                              onSelectionChange={(e) => {
                                setFilters((prev) => ({
                                  ...prev,
                                  limit: Number(e.currentKey),
                                  page: 1,
                                }));
                              }}
                              selectorIconColor="text-text"
                              classNames={{
                                base: 'w-40',
                                label: 'text-text group-data-[filled-within=true]:text-text',
                                trigger: 'bg-backgroundSecondary data-[open=true]:border-border',
                                value: 'text-text group-data-[has-value=true]:text-text',
                                listbox:
                                  'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                                selectorIcon: 'text-text',
                              }}
                            >
                              <SelectItem key="10">10</SelectItem>
                              <SelectItem key="20">20</SelectItem>
                              <SelectItem key="50">50</SelectItem>
                              <SelectItem key="100">100</SelectItem>
                            </SelectWithClassName>
                            <ModeSwitch
                              isSelected={mode === 'table'}
                              onValueChange={handleModeChange}
                            />
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            {filters.page && filters.limit && (
                              <p className="text-sm text-text">
                                Showing{' '}
                                {exercisesData?.total ? (filters.page - 1) * filters.limit + 1 : 0}{' '}
                                to{' '}
                                {Math.min(filters.page * filters.limit, exercisesData?.total || 0)}{' '}
                                of {exercisesData?.total || 0} exercises
                              </p>
                            )}
                          </div>

                          <ExerciseList
                            exercises={exercisesData?.exercises || []}
                            onEdit={handleEditClick}
                            onView={handleViewClick}
                            onDelete={handleDeleteClick}
                            ableToAction={isAdmin()}
                            canApprove={handleApproveClick}
                            mode={mode}
                            sortDescriptor={sortDescriptor}
                            onSortChange={handleSortChange}
                          />

                          {exercisesData && exercisesData.totalPages > 1 && (
                            <div className="flex justify-center mt-6">
                              <Pagination
                                loop
                                showControls
                                page={exercisesData.page}
                                total={exercisesData.totalPages}
                                onChange={(page: number) =>
                                  setFilters((prev) => ({ ...prev, page }))
                                }
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              </Tab>
              <Tab key="core-movements" title="Category">
                <div className="space-y-4">
                  <Card className="bg-background border border-border">
                    <CardHeader className="flex justify-between items-center gap-4">
                      <h3 className="text-lg font-medium text-text">Category Manage</h3>
                      <Button
                        isIconOnly
                        variant="bordered"
                        color="primary"
                        onPress={() => setIsCreateExerciseCategoryOpen((prev) => !prev)}
                        isLoading={createExerciseCategoryMutation.isPending}
                        isDisabled={createExerciseCategoryMutation.isPending}
                      >
                        <FaPlus className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardBody>
                      {isLoadingExerciseCategories ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center gap-4">
                            <SelectWithClassName
                              aria-label="Limit"
                              id="limit"
                              label="Limit"
                              labelPlacement="outside-left"
                              variant="bordered"
                              selectedKeys={
                                exerciseCategoryFilters.limit
                                  ? [exerciseCategoryFilters.limit.toString()]
                                  : []
                              }
                              onSelectionChange={(e) => {
                                setExerciseCategoryFilters((prev) => ({
                                  ...prev,
                                  limit: Number(e.currentKey),
                                  page: 1,
                                }));
                              }}
                              selectorIconColor="text-text"
                              classNames={{
                                base: 'w-40',
                                label: 'text-text group-data-[filled-within=true]:text-text',
                                trigger: 'bg-backgroundSecondary data-[open=true]:border-border',
                                value: 'text-text group-data-[has-value=true]:text-text',
                                listbox:
                                  'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                                selectorIcon: 'text-text',
                              }}
                            >
                              <SelectItem key="10">10</SelectItem>
                              <SelectItem key="20">20</SelectItem>
                              <SelectItem key="50">50</SelectItem>
                              <SelectItem key="100">100</SelectItem>
                            </SelectWithClassName>
                            <ModeSwitch
                              isSelected={mode === 'table'}
                              onValueChange={handleModeChange}
                            />
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            {exerciseCategoryFilters.page && exerciseCategoryFilters.limit && (
                              <p className="text-sm text-text">
                                Showing{' '}
                                {exerciseCategoriesData?.total
                                  ? (exerciseCategoryFilters.page - 1) *
                                  exerciseCategoryFilters.limit +
                                  1
                                  : 0}{' '}
                                to{' '}
                                {Math.min(
                                  exerciseCategoryFilters.page * exerciseCategoryFilters.limit,
                                  exerciseCategoriesData?.total || 0,
                                )}{' '}
                                of {exerciseCategoriesData?.total || 0} categories
                              </p>
                            )}
                          </div>

                          <ExerciseCategoryList
                            categories={exerciseCategoriesData?.exercise_categories || []}
                            onEdit={handleCategoryEditClick}
                            onView={handleCategoryViewClick}
                            onDelete={handleCategoryDeleteClick}
                            ableToAction={isAdmin()}
                            mode={mode}
                            sortDescriptor={exerciseCategoryFilters.sortBy ? {
                              column: exerciseCategoryFilters.sortBy || 'created_at',
                              direction: exerciseCategoryFilters.sortOrder === 'asc' ? 'ascending' : 'descending',
                            } : undefined}
                            onSortChange={handleCategorySortChange}
                          />

                          {exerciseCategoriesData &&
                            Math.ceil(exerciseCategoriesData.total / (filters.limit || 10)) > 1 && (
                              <div className="flex justify-center mt-6">
                                <Pagination
                                  loop
                                  showControls
                                  page={exerciseCategoriesData.page}
                                  total={Math.ceil(
                                    exerciseCategoriesData.total / (filters.limit || 10),
                                  )}
                                  onChange={(page: number) =>
                                    setFilters((prev) => ({ ...prev, page }))
                                  }
                                />
                              </div>
                            )}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        <Drawer
          backdrop="blur"
          isOpen={isCreateExerciseOpen}
          onClose={() => setIsCreateExerciseOpen(false)}
          size="2xl"
          hideCloseButton
        >
          <DrawerContent className="bg-backgroundSecondary">
            {(onClose) => (
              <>
                <DrawerHeader className="flex justify-between gap-4">
                  <h3 className="text-lg font-medium">Create Exercise</h3>
                  <Button
                    isIconOnly
                    variant="bordered"
                    color="danger"
                    onPress={() => {
                      onClose();
                      setIsCreateExerciseOpen(false);
                    }}
                  >
                    <FaTimes />
                  </Button>
                </DrawerHeader>
                <DrawerBody>
                  <ExerciseForm
                    onSubmit={handleCreateExercise}
                    data={initialExercise}
                    errors={errors}
                    categories={exerciseCategoriesData?.exercise_categories || []}
                  />
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>

        <Drawer
          backdrop="blur"
          isOpen={exerciseDrawer.open}
          onClose={() => {
            setExerciseDrawer({ open: false, type: 'edit' });
            setEditExerciseData(null);
            setErrors({});
          }}
          size="2xl"
          hideCloseButton
        >
          <DrawerContent className="bg-backgroundSecondary">
            {(onClose) => (
              <>
                <DrawerHeader className="flex justify-between gap-4">
                  <h3 className="text-lg font-medium">
                    {exerciseDrawer.type === 'edit' ? 'Edit Exercise' : 'View Exercise'}
                  </h3>
                  <Button
                    isIconOnly
                    variant="bordered"
                    color="danger"
                    onPress={() => {
                      onClose();
                      setExerciseDrawer({ open: false, type: 'edit' });
                      setEditExerciseData(null);
                      setErrors({});
                    }}
                  >
                    <FaTimes />
                  </Button>
                </DrawerHeader>
                <DrawerBody className="mb-10">
                  <ExerciseForm
                    isEdit={exerciseDrawer.type === 'edit'}
                    isReadonly={exerciseDrawer.type === 'view'}
                    onSubmit={handleEditExercise}
                    data={editExerciseData || null}
                    errors={errors}
                    categories={exerciseCategoriesData?.exercise_categories || []}
                  />
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>

        <ImportExerciseModal
          isOpen={isImportExerciseOpen}
          onClose={() => setIsImportExerciseOpen(false)}
          onImport={handleBulkImport}
          initialExercise={initialExercise}
          categories={exerciseCategoriesData?.exercise_categories || []}
        />

        <ConfirmationModal
          isOpen={isConfirmDialogOpen !== ''}
          onClose={() => {
            setIsConfirmDialogOpen('');
          }}
          onConfirm={() => {
            if (isConfirmDialogOpen !== '') {
              handleDeleteExercise(isConfirmDialogOpen);
            }
            setIsConfirmDialogOpen('');
          }}
          title="Delete Exercise"
          message="Are you sure you want to delete this exercise? This action cannot be undone."
          confirmText={deleteExerciseMutation.isPending ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          confirmVariant="danger"
          isLoading={deleteExerciseMutation.isPending}
        />

        <ConfirmationModal
          isOpen={isConfirmApproveDialogOpen !== ''}
          onClose={() => {
            setIsConfirmApproveDialogOpen('');
          }}
          onConfirm={() => {
            if (isConfirmApproveDialogOpen !== '') {
              handleApproveExercise(isConfirmApproveDialogOpen);
            }
            setIsConfirmApproveDialogOpen('');
          }}
          title="Approve Exercise"
          message="Are you sure you want to approve this exercise? This action cannot be undone."
          confirmText={approveExerciseMutation.isPending ? 'Approving...' : 'Approve'}
          cancelText="Cancel"
          confirmVariant="success"
          isLoading={approveExerciseMutation.isPending}
        />

        {/* Exercise Category Drawers */}
        <Drawer
          backdrop="blur"
          isOpen={isCreateExerciseCategoryOpen}
          onClose={() => setIsCreateExerciseCategoryOpen(false)}
          size="lg"
          hideCloseButton
        >
          <DrawerContent className="bg-backgroundSecondary">
            {(onClose) => (
              <>
                <DrawerHeader className="flex justify-between gap-4">
                  <h3 className="text-lg font-medium">Create Category</h3>
                  <Button
                    isIconOnly
                    variant="bordered"
                    color="danger"
                    onPress={() => {
                      onClose();
                      setIsCreateExerciseCategoryOpen(false);
                      setCategoryErrors({});
                    }}
                  >
                    <FaTimes />
                  </Button>
                </DrawerHeader>
                <DrawerBody>
                  <ExerciseCategoryForm
                    onSubmit={handleCreateExerciseCategory}
                    data={{ name: '', description: '' }}
                    errors={categoryErrors}
                    isLoading={createExerciseCategoryMutation.isPending}
                  />
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>

        <Drawer
          backdrop="blur"
          isOpen={exerciseCategoryDrawer.open}
          onClose={() => {
            setExerciseCategoryDrawer({ open: false, type: 'edit' });
            setEditExerciseCategoryData(null);
            setCategoryErrors({});
          }}
          size="lg"
          hideCloseButton
        >
          <DrawerContent className="bg-backgroundSecondary">
            {(onClose) => (
              <>
                <DrawerHeader className="flex justify-between gap-4">
                  <h3 className="text-lg font-medium">
                    {exerciseCategoryDrawer.type === 'edit' ? 'Edit Category' : 'View Category'}
                  </h3>
                  <Button
                    isIconOnly
                    variant="bordered"
                    color="danger"
                    onPress={() => {
                      onClose();
                      setExerciseCategoryDrawer({ open: false, type: 'edit' });
                      setEditExerciseCategoryData(null);
                      setCategoryErrors({});
                    }}
                  >
                    <FaTimes />
                  </Button>
                </DrawerHeader>
                <DrawerBody className="mb-10">
                  <ExerciseCategoryForm
                    isEdit={exerciseCategoryDrawer.type === 'edit'}
                    isReadonly={exerciseCategoryDrawer.type === 'view'}
                    onSubmit={handleEditExerciseCategory}
                    data={editExerciseCategoryData}
                    errors={categoryErrors}
                    isLoading={updateExerciseCategoryMutation.isPending}
                  />
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>

        <ConfirmationModal
          isOpen={isConfirmCategoryDeleteOpen !== ''}
          onClose={() => {
            setIsConfirmCategoryDeleteOpen('');
          }}
          onConfirm={() => {
            if (isConfirmCategoryDeleteOpen !== '') {
              handleDeleteExerciseCategory(isConfirmCategoryDeleteOpen);
            }
            setIsConfirmCategoryDeleteOpen('');
          }}
          title="Delete Category"
          message="Are you sure you want to delete this category? This action cannot be undone. Exercises using this category may be affected."
          confirmText={deleteExerciseCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          confirmVariant="danger"
          isLoading={deleteExerciseCategoryMutation.isPending}
        />
      </PageWrapper>
    </Suspense>
  );
}
