'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Textarea } from '@heroui/react';
import {
  CreateExerciseCategoryRequest,
  UpdateExerciseCategoryRequest,
} from '@/hooks/api/use-exercise-categories';

export interface ExerciseCategoryFormProps {
  data: CreateExerciseCategoryRequest | UpdateExerciseCategoryRequest | null;
  onSubmit: (data: CreateExerciseCategoryRequest | UpdateExerciseCategoryRequest) => void;
  isEdit?: boolean;
  isReadonly?: boolean;
  errors?: Record<string, string>;
  isLoading?: boolean;
}

export const ExerciseCategoryForm = ({
  data,
  onSubmit,
  isEdit = false,
  isReadonly = false,
  errors = {},
  isLoading = false,
}: ExerciseCategoryFormProps) => {
  const [formData, setFormData] = useState<
    CreateExerciseCategoryRequest | UpdateExerciseCategoryRequest
  >({
    name: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  useEffect(() => {
    setFormErrors(errors);
  }, [errors]);

  const handleInputChange = useCallback(
    (field: keyof CreateExerciseCategoryRequest) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({
          ...prev,
          [field]: e.target.value,
        }));
        // Clear error when user starts typing
        if (formErrors[field]) {
          setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      },
    [formErrors],
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Category name must be less than 255 characters';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (isReadonly) return;

      if (!validateForm()) return;

      onSubmit(formData);
    },
    [formData, isReadonly, validateForm, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="category-name"
        label="Category Name"
        placeholder="Enter category name"
        variant="bordered"
        value={formData.name || ''}
        onChange={handleInputChange('name')}
        isInvalid={!!formErrors.name}
        errorMessage={formErrors.name}
        isRequired
        isDisabled={isReadonly}
        classNames={{
          base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
          input: `text-text ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
          inputWrapper: `bg-surface border-border ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
          label: `text-text ${isReadonly ? 'opacity-100' : ''}`,
        }}
      />

      <Textarea
        id="category-description"
        label="Description"
        placeholder="Enter category description (optional)"
        variant="bordered"
        value={formData.description || ''}
        onChange={handleInputChange('description')}
        isDisabled={isReadonly}
        minRows={3}
        maxRows={6}
        classNames={{
          base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
          input: `text-text ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
          inputWrapper: `bg-surface border-border ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
          label: `text-text ${isReadonly ? 'opacity-100' : ''}`,
        }}
      />

      {!isReadonly && (
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            color="primary"
            variant="solid"
            isLoading={isLoading}
            isDisabled={isLoading}
          >
            {isEdit ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      )}
    </form>
  );
};

export default ExerciseCategoryForm;

