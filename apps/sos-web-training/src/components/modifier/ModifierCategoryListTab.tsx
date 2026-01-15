'use client';

import React from 'react';
import {
  Button,
  Card,
  CardBody,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { FaCheck, FaEdit, FaEye, FaPlus, FaSync, FaTrash } from 'react-icons/fa';
import { ModifierCategory } from '@/hooks/api/use-modifier';
import { StatusBadge } from './StatusBadge';
import { useIsMobile } from '@/hooks/api/use-screen-utils';

interface ModifierCategoryListTabProps {
  categories: ModifierCategory[];
  isLoading: boolean;
  isAdmin: boolean;
  onRefresh: () => void;
  onCreateClick: () => void;
  onEditClick: (category: ModifierCategory) => void;
  onDeleteClick: (id: string) => void;
  onApproveClick: (id: string) => void;
  onViewClick: (modifier: ModifierCategory) => void;
}

export function ModifierCategoryListTab({
  categories,
  isLoading,
  isAdmin,
  onRefresh,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onApproveClick,
  onViewClick,
}: ModifierCategoryListTabProps) {
  const isMobile = useIsMobile();

  return (
    <>
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-semibold">List Modifier Categories</div>
          <Button isIconOnly variant="solid" size="sm" color="secondary" onPress={onRefresh}>
            <FaSync className="text-white" />
          </Button>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            className="w-fit"
            variant="solid"
            color="primary"
            onPress={onCreateClick}
            isIconOnly={isMobile}
          >
            {isMobile ? <FaPlus className="text-white" /> : 'New Modifier Category'}
          </Button>
        )}
      </div>

      <Card className="bg-backgroundSecondary border border-border">
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8 text-text">
              <span className="text-muted">Loading modifier categories...</span>
            </div>
          ) : !categories.length ? (
            <div className="text-center py-8 text-text">
              <span className="text-muted">No modifier categories found.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table
                  aria-label="Modifier Categories Table"
                  removeWrapper
                  classNames={{
                    tr: 'bg-transparent',
                    td: 'text-text',
                  }}
                >
                  <TableHeader>
                    <TableColumn>Category Name</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn width={100} className="text-end">
                      Actions
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <span className="font-medium">{category.name}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={category.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            {
                              isAdmin ? (
                                <>
                                  {category.status === 'PENDING' && (
                                    <Button
                                      isIconOnly
                                      variant="solid"
                                      color="success"
                                      onPress={() => onApproveClick(category.id)}
                                    >
                                      <FaCheck className="text-white" />
                                    </Button>
                                  )}
                                  <Button
                                    isIconOnly
                                    variant="solid"
                                    color="primary"
                                    onPress={() => onEditClick(category)}
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    isIconOnly
                                    variant="solid"
                                    color="danger"
                                    onPress={() => onDeleteClick(category.id)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </>
                              ) : (
                                 <Button
                                    isIconOnly
                                    variant="solid"
                                    color="primary"
                                    onPress={() => onViewClick(category)}
                                  >
                                    <FaEye className="text-white" />
                                  </Button>
                              )
                            }
                            
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
