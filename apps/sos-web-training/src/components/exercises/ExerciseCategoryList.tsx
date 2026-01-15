'use client';

import React from 'react';
import {
  ExerciseCategory,
  UpdateExerciseCategoryRequest,
} from '@/hooks/api/use-exercise-categories';
import {
  Card,
  Button,
  CardBody,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableColumn,
  TableHeader,
  SortDescriptor,
} from '@heroui/react';
import { FaPencil } from 'react-icons/fa6';
import { FaEye, FaTrash, FaFolderOpen } from 'react-icons/fa';
import dayjs from 'dayjs';

export interface ExerciseCategoryListProps {
  categories: ExerciseCategory[];
  className?: string;
  onEdit?: (category: UpdateExerciseCategoryRequest) => void;
  onDelete?: (category: ExerciseCategory) => void;
  onView?: (category: UpdateExerciseCategoryRequest) => void;
  ableToAction?: boolean;
  mode?: 'table' | 'card';
  sortDescriptor?: SortDescriptor;
  onSortChange?: (sortDescriptor: SortDescriptor) => void;
}

export const ExerciseCategoryList = ({
  categories,
  className = '',
  onEdit,
  onDelete,
  onView,
  ableToAction,
  mode = 'card',
  sortDescriptor,
  onSortChange,
}: ExerciseCategoryListProps) => {
  if (categories.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-textMuted">
          <FaFolderOpen className="mx-auto h-12 w-12 text-textMuted" />
          <h3 className="mt-2 font-medium text-text">No exercise categories found</h3>
        </div>
      </div>
    );
  }

  const prepareData = (category: ExerciseCategory, type: 'edit' | 'view') => {
    const payload: UpdateExerciseCategoryRequest = {
      id: category.id,
      name: category.name,
      description: category.description || undefined,
    };

    if (type === 'edit') {
      onEdit?.(payload);
    }

    if (type === 'view') {
      onView?.(payload);
    }

    return payload;
  };

  return (
    <>
      {mode === 'table' ? (
        <Table
          aria-label="Exercise Categories Table"
          classNames={{
            wrapper: 'bg-backgroundSecondary border-border border-2',
            th: 'bg-surface text-text',
            td: 'text-text',
            tbody: 'bg-backgroundSecondary',
          }}
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
        >
          <TableHeader>
            <TableColumn key="created_at" align="center" allowsSorting>
              Created At
            </TableColumn>
            <TableColumn key="name" allowsSorting>
              Name
            </TableColumn>
            <TableColumn key="description">Description</TableColumn>
            <TableColumn align="center" style={{ width: '100px' }}>
              Actions
            </TableColumn>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{dayjs(category.created_at).format('MM/DD/YYYY')}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell className="flex items-center gap-2">
                  {ableToAction ? (
                    onEdit &&
                    onDelete && (
                      <>
                        <Button
                          variant="solid"
                          size="sm"
                          color="primary"
                          isIconOnly
                          onPress={() => {
                            prepareData(category, 'edit');
                          }}
                        >
                          <FaPencil className="text-white" />
                        </Button>
                        <Button
                          variant="solid"
                          size="sm"
                          color="danger"
                          isIconOnly
                          onPress={() => {
                            onDelete?.(category);
                          }}
                        >
                          <FaTrash className="text-white" />
                        </Button>
                      </>
                    )
                  ) : (
                    <Button
                      variant="solid"
                      size="sm"
                      color="primary"
                      isIconOnly
                      onPress={() => {
                        prepareData(category, 'view');
                      }}
                    >
                      <FaEye className="text-white" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className={`exercise-category-list space-y-4 ${className}`}>
          {categories.map((category) => {
            return (
              <Card
                key={category.id}
                className={`exercise-category-item transition-all duration-200 bg-background border border-border`}
              >
                <CardBody>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-text">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-textMuted mt-1">{category.description}</p>
                      )}
                      <p className="text-xs text-textMuted mt-2">
                        Created: {dayjs(category.created_at).format('MMM DD, YYYY')}
                      </p>
                    </div>
                    <div className="w-full md:w-auto flex items-center gap-2 justify-end">
                      {ableToAction ? (
                        onEdit &&
                        onDelete && (
                          <>
                            <Button
                              variant="solid"
                              size="sm"
                              color="primary"
                              isIconOnly
                              onPress={() => {
                                prepareData(category, 'edit');
                              }}
                            >
                              <FaPencil className="text-white" />
                            </Button>
                            <Button
                              variant="solid"
                              size="sm"
                              color="danger"
                              isIconOnly
                              onPress={() => {
                                onDelete?.(category);
                              }}
                            >
                              <FaTrash className="text-white" />
                            </Button>
                          </>
                        )
                      ) : (
                        <Button
                          variant="solid"
                          size="sm"
                          color="primary"
                          isIconOnly
                          onPress={() => {
                            prepareData(category, 'view');
                          }}
                        >
                          <FaEye className="text-white" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default ExerciseCategoryList;

