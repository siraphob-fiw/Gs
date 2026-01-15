'use client';

import { Card, CardBody, CardHeader, Input, SelectItem } from '@heroui/react';
import { FaFilter, FaSearch } from 'react-icons/fa';
import { ExerciseFilters } from '@strengthos/shared-types';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { BodyPart } from '@/components/forms/ExerciseForm';
import { ExerciseCategory } from '@/hooks/api/use-exercise-categories';

interface ExerciseFiltersProps {
  filters: ExerciseFilters;
  onFiltersChange: (filters: ExerciseFilters) => void;
  categories?: ExerciseCategory[];
}

export const ExerciseFiltersSection = ({
  filters,
  onFiltersChange,
  categories = [],
}: ExerciseFiltersProps) => {
  return (
    <Card className="bg-background border border-border">
      <CardHeader>
        <h3 className="text-lg font-medium text-text flex items-center gap-2">
          <FaFilter className="w-4 h-4 text-text" /> Filters
        </h3>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-4 justify-center items-center">
          <Input
            label="Search"
            placeholder={'Search exercises...'}
            isClearable
            variant="bordered"
            value={filters.search ?? ''}
            onValueChange={(e) => onFiltersChange({ ...filters, search: e, page: 1 })}
            autoComplete="off"
            startContent={<FaSearch className="w-4 h-4 text-text" />}
            onClear={() => {
              onFiltersChange({ ...filters, search: '', page: 1 });
            }}
            classNames={{
              inputWrapper: 'bg-transparent',
              input: 'text-text',
            }}
          />
          <div className="w-full flex flex-col md:flex-row items-center gap-2">
            <div className="flex-1 w-full">
              <SelectWithClassName
                aria-label="Exercise Type"
                fullwidth
                id="exercise-type"
                label="Exercise Type"
                placeholder="Select Exercise Type"
                variant="bordered"
                selectedKeys={filters.exerciseType ? [filters.exerciseType] : []}
                onSelectionChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    exerciseType: e.currentKey as string,
                    page: 1,
                  })
                }
                selectorIconColor="text-text"
                classNames={{
                  trigger: 'bg-background data-[open=true]:border-border',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                }}
              >
                {categories.map((category) => (
                  <SelectItem key={category.name}>{category.name}</SelectItem>
                ))}
              </SelectWithClassName>
            </div>
            <div className="flex-1 w-full">
              <SelectWithClassName
                aria-label="Body Part"
                fullwidth
                id="body-part"
                label="Body Part"
                placeholder="Select Body Part"
                variant="bordered"
                selectionMode="multiple"
                selectedKeys={filters.bodyParts ? filters.bodyParts : []}
                onSelectionChange={(keys) => {
                  if ('currentKey' in keys && keys.currentKey === '') {
                    const { bodyParts, ...rest } = filters;
                    onFiltersChange({
                      ...rest,
                      page: 1,
                    });
                  } else {
                    onFiltersChange({
                      ...filters,
                      bodyParts: Array.from(keys) as BodyPart[],
                      page: 1,
                    });
                  }
                }}
                selectorIconColor="text-text"
                classNames={{
                  trigger: 'bg-background data-[open=true]:border-border',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                }}
              >
                {Object.entries(BodyPart).map(([key, value]) => (
                  <SelectItem key={key} textValue={value}>
                    {value.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectWithClassName>
            </div>
            <div className="flex-1 w-full">
              <SelectWithClassName
                aria-label="Status"
                fullwidth
                id="is_approved"
                label="Status"
                placeholder="Select status"
                variant="bordered"
                selectedKeys={
                  filters.status !== undefined ? (filters.status ? ['true'] : ['false']) : ['all']
                }
                onSelectionChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    status:
                      e.currentKey === 'all' ? undefined : e.currentKey === 'true' ? true : false,
                    page: 1,
                  });
                }}
                selectorIconColor="text-text"
                classNames={{
                  trigger: 'bg-background data-[open=true]:border-border',
                  value: 'text-text group-data-[has-value=true]:text-text',
                  listbox:
                    'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                }}
              >
                <SelectItem key="all" textValue="All">
                  All
                </SelectItem>
                <SelectItem key="true" textValue="Approved">
                  Approved
                </SelectItem>
                <SelectItem key="false" textValue="Not Approved">
                  Not Approved
                </SelectItem>
              </SelectWithClassName>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
