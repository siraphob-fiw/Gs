'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Input,
} from '@heroui/react';
import { useModifierCategories, useModifiers } from '@/hooks/api/use-modifier';
import { FaSearch } from 'react-icons/fa';
import { isMultiSelectCategory } from '@/utils/exercise-name-modifier';

interface ModifierSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  day: number;
  exerciseId: string;
  order: number;
  selectedModifiers: string[];
  onModifierChange: (
    day: number,
    exerciseId: string,
    order: number,
    modifierId: string,
    categoryId?: string,
  ) => void;
  onMultiModifierChange?: (
    day: number,
    exerciseId: string,
    order: number,
    modifierIds: string[],
    categoryId: string,
  ) => void;
}

export const ModifierSelector = ({
  isOpen,
  onClose,
  day,
  exerciseId,
  order,
  selectedModifiers,
  onModifierChange,
  onMultiModifierChange,
}: ModifierSelectorProps) => {
  const { data: modifiersData } = useModifiers({ limit: 1000 });
  const { data: modifierCategoriesData } = useModifierCategories({ limit: 1000 });
  const [searchTerm, setSearchTerm] = useState('');

  if (!exerciseId) return null;

  const hasModifiers = modifierCategoriesData?.modifier_categories
    ?.sort((a, b) => a.name.localeCompare(b.name))
    .some((category) => {
      const count =
        modifiersData?.modifiers?.filter(
          (modifier) => modifier.modifier_category_id === category.id,
        )?.length ?? 0;
      return count > 0;
    });

  return (
    <Modal
      scrollBehavior="inside"
      className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
      isOpen={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
          setSearchTerm('');
        }
      }}
      size="2xl"
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center gap-4">
          <div className="text-2xl font-semibold text-text">Select Modifier</div>
        </ModalHeader>
        <ModalBody>
          <div className="mb-4">
            <Input
              placeholder="Search modifiers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<FaSearch className="text-text" />}
              classNames={{
                inputWrapper:
                  'border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary bg-background',
                input: 'text-text group-data-[has-value=true]:text-text',
              }}
            />
          </div>
          {modifierCategoriesData?.modifier_categories &&
          modifierCategoriesData.modifier_categories.length > 0 ? (
            hasModifiers ? (
              modifierCategoriesData.modifier_categories
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((category) => {
                  const modifiers =
                    modifiersData?.modifiers?.filter(
                      (modifier) => modifier.modifier_category_id === category.id,
                    ) ?? [];
                  if (modifiers.length === 0) return null;

                  const isMultiSelect = isMultiSelectCategory(category.name);

                  // Get selected modifiers for this category
                  const selectedModifiersForCategory = (() => {
                    if (!Array.isArray(selectedModifiers)) return [];
                    return selectedModifiers.filter((modifierId) => {
                      const mod = modifiersData?.modifiers?.find((m) => m.id === modifierId);
                      return mod?.modifier_category_id === category.id;
                    });
                  })();

                  const filteredModifiers = modifiers.filter((modifier) =>
                    modifier.name.toLowerCase().includes(searchTerm.toLowerCase()),
                  );

                  if (isMultiSelect) {
                    // Multi-select category - use CheckboxGroup
                    return (
                      <div key={category.id} className="border border-border rounded-lg p-2">
                        <div className="mb-2">
                          <div className="font-medium text-text mb-1">
                            {category.name}
                            <span className="text-xs text-textSecondary ml-2">(multiple)</span>
                          </div>
                          <CheckboxGroup
                            orientation="horizontal"
                            className="gap-4 flex flex-wrap"
                            value={selectedModifiersForCategory}
                            onValueChange={(values) => {
                              if (onMultiModifierChange) {
                                onMultiModifierChange(day, exerciseId, order, values, category.id);
                              } else {
                                // Fallback: handle each change individually
                                // Find what was added or removed
                                const added = values.filter(
                                  (v) => !selectedModifiersForCategory.includes(v),
                                );
                                const removed = selectedModifiersForCategory.filter(
                                  (v) => !values.includes(v),
                                );

                                // Process additions
                                for (const modifierId of added) {
                                  onModifierChange(day, exerciseId, order, modifierId, category.id);
                                }
                                // Process removals by setting empty string (handled by parent)
                                for (const modifierId of removed) {
                                  onModifierChange(day, exerciseId, order, '', category.id);
                                }
                              }
                            }}
                          >
                            {filteredModifiers.map((modifier) => (
                              <Checkbox
                                key={modifier.id}
                                value={modifier.id}
                                size="sm"
                                classNames={{
                                  label: 'text-sm text-text font-medium',
                                }}
                              >
                                {modifier.name}
                              </Checkbox>
                            ))}
                          </CheckboxGroup>
                        </div>
                      </div>
                    );
                  }

                  // Single-select category - use RadioGroup
                  const selectedModifierId =
                    selectedModifiersForCategory.length > 0 ? selectedModifiersForCategory[0] : '';

                  return (
                    <div key={category.id} className="border border-border rounded-lg p-2">
                      <div className="mb-2">
                        <div className="font-medium text-text mb-1">{category.name}</div>
                        <RadioGroup
                          orientation="horizontal"
                          className="gap-4 flex flex-wrap"
                          value={selectedModifierId}
                          onValueChange={(val) => {
                            onModifierChange(day, exerciseId, order, val, category.id);
                          }}
                        >
                          <Radio
                            value=""
                            size="sm"
                            classNames={{ label: 'text-sm text-text font-medium' }}
                          >
                            {category.name === 'Bar type' ? 'Barbell' : 'None'}
                          </Radio>
                          {filteredModifiers.map((modifier) => (
                            <div key={modifier.id} className="flex flex-col gap-2">
                              <Radio
                                value={modifier.id}
                                size="sm"
                                classNames={{
                                  label: 'text-sm text-text font-medium',
                                }}
                              >
                                {modifier.name}
                              </Radio>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center text-muted-foreground">No modifiers available.</div>
            )
          ) : (
            <div className="text-center text-muted-foreground">
              No modifier categories available.
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="solid"
            color="success"
            className="text-white"
            onPress={() => {
              onClose();
              setSearchTerm('');
            }}
          >
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
