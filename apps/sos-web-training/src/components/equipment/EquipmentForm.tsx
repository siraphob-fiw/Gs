'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Textarea, Switch, SelectItem } from '@heroui/react';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import {
    CreateEquipmentRequest,
    UpdateEquipmentRequest,
    EquipmentCategory,
    EquipmentAvailability,
} from '@/hooks/api/use-equipment';

export interface EquipmentFormProps {
    data: CreateEquipmentRequest | UpdateEquipmentRequest | null;
    onSubmit: (data: CreateEquipmentRequest | UpdateEquipmentRequest) => void;
    isEdit?: boolean;
    isReadonly?: boolean;
    errors?: Record<string, string>;
    isLoading?: boolean;
    categories?: EquipmentCategory[];
}

const availabilityOptions: { value: EquipmentAvailability; label: string }[] = [
    { value: 'common_gym', label: 'Common Gym' },
    { value: 'home', label: 'Home' },
    { value: 'specialty_gym', label: 'Specialty Gym' },
];

export const EquipmentForm = ({
    data,
    onSubmit,
    isEdit = false,
    isReadonly = false,
    errors = {},
    isLoading = false,
    categories = [],
}: EquipmentFormProps) => {
    const [formData, setFormData] = useState<
        CreateEquipmentRequest | UpdateEquipmentRequest
    >({
        name: '',
        type: '',
        availability: 'common_gym',
        category_id: undefined,
        description: '',
        is_active: true,
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
        (field: keyof CreateEquipmentRequest) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setFormData((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                }));
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
            newErrors.name = 'Equipment name is required';
        } else if (formData.name.length > 200) {
            newErrors.name = 'Equipment name must be less than 200 characters';
        }

        if (!formData.type?.trim()) {
            newErrors.type = 'Equipment type is required';
        } else if (formData.type.length > 100) {
            newErrors.type = 'Equipment type must be less than 100 characters';
        }

        if (!formData.availability) {
            newErrors.availability = 'Availability is required';
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
                id="equipment-name"
                label="Equipment Name"
                placeholder="Enter equipment name"
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

            <Input
                id="equipment-type"
                label="Equipment Type"
                placeholder="Enter equipment type (e.g., Olympic Bar, Cable Machine)"
                variant="bordered"
                value={formData.type || ''}
                onChange={handleInputChange('type')}
                isInvalid={!!formErrors.type}
                errorMessage={formErrors.type}
                isRequired
                isDisabled={isReadonly}
                classNames={{
                    base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
                    input: `text-text ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
                    inputWrapper: `bg-surface border-border ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
                    label: `text-text ${isReadonly ? 'opacity-100' : ''}`,
                }}
            />

            <SelectWithClassName
                id="equipment-availability"
                label="Availability"
                placeholder="Select availability"
                variant="bordered"
                selectedKeys={formData.availability ? [formData.availability] : []}
                onSelectionChange={(value) => {
                    const selectedValue = Array.from(value)[0] as EquipmentAvailability;
                    setFormData((prev) => ({
                        ...prev,
                        availability: selectedValue,
                    }));
                }}
                isInvalid={!!formErrors.availability}
                errorMessage={formErrors.availability}
                isRequired
                isDisabled={isReadonly}
                selectorIconColor="text-text"
                classNames={{
                    base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
                    trigger: `bg-surface border-border ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
                    value: 'text-text group-data-[has-value=true]:text-text',
                    listbox: 'rounded-md border border-border',
                    label: `text-text ${isReadonly ? 'opacity-100' : ''}`,
                }}
            >
                {availabilityOptions.map((option) => (
                    <SelectItem key={option.value} textValue={option.label}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectWithClassName>

            {categories.length > 0 && (
                <SelectWithClassName
                    id="equipment-category"
                    label="Category"
                    placeholder="Select category (optional)"
                    variant="bordered"
                    selectedKeys={formData.category_id ? [formData.category_id] : []}
                    onSelectionChange={(value) => {
                        const selectedValue = Array.from(value)[0] as string;
                        setFormData((prev) => ({
                            ...prev,
                            category_id: selectedValue || undefined,
                        }));
                    }}
                    isDisabled={isReadonly}
                    selectorIconColor="text-text"
                    classNames={{
                        base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
                        trigger: `bg-surface border-border ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
                        value: 'text-text group-data-[has-value=true]:text-text',
                        listbox: 'rounded-md border border-border',
                        label: `text-text ${isReadonly ? 'opacity-100' : ''}`,
                    }}
                >
                    {categories.map((category) => (
                        <SelectItem key={category.id} textValue={category.name}>
                            {category.name}
                        </SelectItem>
                    ))}
                </SelectWithClassName>
            )}

            <Textarea
                id="equipment-description"
                label="Description"
                placeholder="Enter equipment description (optional)"
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

            <div className="flex items-center gap-4">
                <Switch
                    id="equipment-active"
                    isSelected={formData.is_active ?? true}
                    onValueChange={(checked) => {
                        setFormData((prev) => ({
                            ...prev,
                            is_active: checked,
                        }));
                    }}
                    isDisabled={isReadonly}
                    classNames={{
                        wrapper: 'bg-border group-data-[selected=true]:bg-primary',
                        label: 'text-text',
                    }}
                >
                    Active
                </Switch>
            </div>

            {!isReadonly && (
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="submit"
                        color="primary"
                        variant="solid"
                        isLoading={isLoading}
                        isDisabled={isLoading}
                    >
                        {isEdit ? 'Update Equipment' : 'Create Equipment'}
                    </Button>
                </div>
            )}
        </form>
    );
};

export default EquipmentForm;

