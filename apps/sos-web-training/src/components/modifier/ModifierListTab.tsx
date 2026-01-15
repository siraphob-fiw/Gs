'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import {
  FaCheck,
  FaEdit,
  FaEye,
  FaPlus,
  FaSearch,
  FaSync,
  FaTrash,
  FaFileExport,
  FaFileImport,
} from 'react-icons/fa';
import { Modifier, ModifierCategory, exportModifiersToCSV } from '@/hooks/api/use-modifier';
import { StatusBadge } from './StatusBadge';
import { useIsMobile } from '@/hooks/api/use-screen-utils';

interface ModifierListTabProps {
  modifiers: Modifier[];
  categories: ModifierCategory[];
  isLoading: boolean;
  isAdmin: boolean;
  onRefresh: () => void;
  onCreateClick: () => void;
  onEditClick: (modifier: Modifier) => void;
  onViewClick: (modifier: Modifier) => void;
  onDeleteClick: (id: string) => void;
  onApproveClick: (id: string) => void;
  onImportClick: () => void;
}

interface CategorySearch {
  categoryId: string;
  search: string;
}

export function ModifierListTab({
  modifiers,
  categories,
  isLoading,
  isAdmin,
  onRefresh,
  onCreateClick,
  onEditClick,
  onViewClick,
  onDeleteClick,
  onApproveClick,
  onImportClick,
}: ModifierListTabProps) {
  const isMobile = useIsMobile();
  const [categorySearch, setCategorySearch] = useState<CategorySearch[]>([]);

  const getSearchValue = (categoryId: string) =>
    categorySearch.find((s) => s.categoryId === categoryId)?.search ?? '';

  const updateSearch = (categoryId: string, value: string) => {
    setCategorySearch((prev) =>
      prev.some((s) => s.categoryId === categoryId)
        ? prev.map((s) => (s.categoryId === categoryId ? { ...s, search: value } : s))
        : [...prev, { categoryId, search: value }],
    );
  };

  const clearSearch = (categoryId: string) => {
    setCategorySearch((prev) => prev.filter((s) => s.categoryId !== categoryId));
  };

  const handleSelectionChange = (keys: any) => {
    let removedKey: string | undefined;
    if (typeof keys === 'object') {
      if ('currentKey' in keys) {
        removedKey = keys.currentKey;
      } else if ('currentKeys' in keys && Array.isArray(keys.currentKeys)) {
        removedKey = keys.currentKeys[0];
      } else if (keys instanceof Set && keys.size === 1) {
        removedKey = Array.from(keys)[0];
      }
    }
    if (removedKey) {
      clearSearch(removedKey);
    }
  };

  const sortModifiers = (mods: Modifier[]) =>
    mods.slice().sort((a, b) => {
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const filterModifiers = (mods: Modifier[], categoryId: string) => {
    const searchTerm = getSearchValue(categoryId).toLowerCase();
    return mods.filter((m) => m.name.toLowerCase().includes(searchTerm));
  };

  const activeCategories = categories.filter((c) => c.status === 'ACTIVE');
  const hasData = categories.length > 0 && modifiers.length > 0;

  return (
    <>
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-semibold">List Modifiers</div>
          <Button isIconOnly variant="solid" size="sm" color="secondary" onPress={onRefresh}>
            <FaSync className="text-white" />
          </Button>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="w-fit"
              variant="solid"
              color="primary"
              onPress={onCreateClick}
              isIconOnly={isMobile}
            >
              {isMobile ? <FaPlus className="text-white" /> : 'New Modifier'}
            </Button>
            <Button
              size="sm"
              variant="bordered"
              color="primary"
              onPress={onImportClick}
              isIconOnly={isMobile}
              className="hover:bg-primary hover:text-surface"
            >
              {isMobile ? (
                <FaFileImport className="w-4 h-4" />
              ) : (
                <>
                  <FaFileImport className="w-4 h-4" /> Import
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="bordered"
              color="primary"
              onPress={() => exportModifiersToCSV(modifiers, categories)}
              isIconOnly={isMobile}
              isDisabled={modifiers.length === 0}
              className="hover:bg-secondary hover:text-white"
            >
              {isMobile ? (
                <FaFileExport className="w-4 h-4" />
              ) : (
                <>
                  <FaFileExport className="w-4 h-4" /> Export
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-backgroundSecondary border border-border">
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8 text-text">
              <span className="text-muted">Loading modifiers...</span>
            </div>
          ) : !hasData ? (
            <div className="text-center py-8 text-text">
              <span className="text-muted">No modifiers found.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Accordion
                selectionMode="multiple"
                variant="splitted"
                itemClasses={{
                  base: 'bg-backgroundSecondary px-0',
                  trigger:
                    'flex items-center justify-between p-4 bg-background text-text font-medium rounded-lg data-[open=true]:rounded-b-none group border border-border',
                  title: 'flex items-center gap-2 text-lg font-semibold',
                  indicator:
                    'text-primary group-data-[open=true]:rotate-90 transition-transform duration-200',
                  content: 'bg-background p-2 text-text rounded-b-lg',
                }}
                onSelectionChange={handleSelectionChange}
              >
                {activeCategories.map((category) => {
                  const categoryModifiers = modifiers.filter(
                    (m) => m.modifier_category_id === category.id,
                  );
                  const filteredModifiers = filterModifiers(
                    sortModifiers(categoryModifiers),
                    category.id,
                  );

                  return (
                    <AccordionItem
                      key={category.id}
                      value={category.id}
                      className="!border-none"
                      textValue={category.name}
                      title={
                        <span className="flex flex-col space-y-1">
                          <span className="font-medium text-text">{category.name}</span>
                          {category.description && (
                            <span className="ml-0 font-light text-sm text-text">
                              {category.description}
                            </span>
                          )}
                        </span>
                      }
                    >
                      {categoryModifiers.length === 0 ? (
                        <span className="text-muted text-sm">No modifiers in this category.</span>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-border bg-background shadow">
                          <Table
                            topContent={
                              <Input
                                isClearable
                                classNames={{
                                  mainWrapper: 'p-2',
                                  inputWrapper:
                                    'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
                                  input: 'text-text group-data-[has-value=true]:text-text',
                                }}
                                placeholder="Search by name..."
                                startContent={<FaSearch className="text-text" />}
                                value={getSearchValue(category.id)}
                                onClear={() => clearSearch(category.id)}
                                onValueChange={(value) => updateSearch(category.id, value)}
                              />
                            }
                            aria-label="Modifier List Table"
                            hideHeader
                            removeWrapper
                            classNames={{
                              wrapper: 'min-w-full',
                              th: 'bg-secondary text-text text-sm font-medium border-b border-border px-4 py-2 text-left uppercase tracking-wider',
                              td: 'text-text border-b border-border px-4 py-2 align-middle',
                            }}
                          >
                            <TableHeader>
                              <TableColumn>Modifier</TableColumn>
                            </TableHeader>
                            <TableBody>
                              {filteredModifiers.map((modifier) => (
                                <TableRow key={modifier.id} className="bg-backgroundSecondary">
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="flex gap-2 flex-1">
                                        <span className="font-medium">{modifier.name}</span>
                                        <StatusBadge status={modifier.status} />
                                      </div>
                                      <div className="flex gap-2 items-center">
                                        {isAdmin ? (
                                          <>
                                            {modifier.status === 'PENDING' && (
                                              <Button
                                                isIconOnly
                                                variant="solid"
                                                color="success"
                                                onPress={() => onApproveClick(modifier.id)}
                                              >
                                                <FaCheck className="text-white" />
                                              </Button>
                                            )}
                                            <Button
                                              isIconOnly
                                              variant="solid"
                                              color="primary"
                                              onPress={() => onEditClick(modifier)}
                                            >
                                              <FaEdit />
                                            </Button>
                                            <Button
                                              isIconOnly
                                              variant="solid"
                                              color="danger"
                                              onPress={() => onDeleteClick(modifier.id)}
                                            >
                                              <FaTrash />
                                            </Button>
                                          </>
                                        ) : (
                                          <Button
                                            isIconOnly
                                            variant="solid"
                                            color="primary"
                                            onPress={() => onViewClick(modifier)}
                                          >
                                            <FaEye className="text-white" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
