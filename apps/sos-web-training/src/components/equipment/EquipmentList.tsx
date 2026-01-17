'use client';

import React from 'react';
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
    Chip,
} from '@heroui/react';
import { FaPencil } from 'react-icons/fa6';
import { FaEye, FaTrash, FaDumbbell, FaCheck, FaTimes } from 'react-icons/fa';
import dayjs from 'dayjs';
import {
    Equipment,
    UpdateEquipmentRequest,
    EquipmentAvailability,
} from '@/hooks/api/use-equipment';

export interface EquipmentListProps {
    equipments: Equipment[];
    className?: string;
    onEdit?: (equipment: UpdateEquipmentRequest) => void;
    onDelete?: (equipment: Equipment) => void;
    onView?: (equipment: UpdateEquipmentRequest) => void;
    ableToAction?: boolean;
    mode?: 'table' | 'card';
    sortDescriptor?: SortDescriptor;
    onSortChange?: (sortDescriptor: SortDescriptor) => void;
}

const getAvailabilityColor = (availability: EquipmentAvailability) => {
    switch (availability) {
        case 'common_gym':
            return 'primary';
        case 'home':
            return 'success';
        case 'specialty_gym':
            return 'warning';
        default:
            return 'default';
    }
};

const formatAvailability = (availability: EquipmentAvailability) => {
    switch (availability) {
        case 'common_gym':
            return 'Gym';
        case 'home':
            return 'Home';
        case 'specialty_gym':
            return 'Specialty';
        default:
            return availability;
    }
};

export const EquipmentList = ({
    equipments,
    className = '',
    onEdit,
    onDelete,
    onView,
    ableToAction,
    mode = 'table',
    sortDescriptor,
    onSortChange,
}: EquipmentListProps) => {
    if (equipments.length === 0) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <div className="text-textMuted">
                    <FaDumbbell className="mx-auto h-12 w-12 text-textMuted" />
                    <h3 className="mt-2 font-medium text-text">No equipment found</h3>
                </div>
            </div>
        );
    }

    const prepareData = (
        equipment: Equipment,
        type: 'edit' | 'view',
    ): UpdateEquipmentRequest => {
        const payload: UpdateEquipmentRequest = {
            id: equipment.id,
            name: equipment.name,
            type: equipment.type,
            availability: equipment.availability,
            category_id: equipment.category_id,
            specifications: equipment.specifications,
            description: equipment.description,
            is_active: equipment.is_active,
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
                    aria-label="Equipment Table"
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
                        <TableColumn key="type" align="center">
                            Type
                        </TableColumn>
                        <TableColumn key="availability" align="center">
                            Availability
                        </TableColumn>
                        <TableColumn key="is_active" align="center">
                            Status
                        </TableColumn>
                        <TableColumn align="center" style={{ width: '100px' }}>
                            Actions
                        </TableColumn>
                    </TableHeader>
                    <TableBody>
                        {equipments.map((equipment) => (
                            <TableRow key={`table-${equipment.id}`}>
                                <TableCell>
                                    {dayjs(equipment.created_at).format('MM/DD/YYYY')}
                                </TableCell>
                                <TableCell>{equipment.name}</TableCell>
                                <TableCell>{equipment.type}</TableCell>
                                <TableCell>
                                    <Chip
                                        size="sm"
                                        color={getAvailabilityColor(equipment.availability)}
                                        variant="flat"
                                    >
                                        {formatAvailability(equipment.availability)}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${equipment.is_active
                                            ? 'bg-success text-white'
                                            : 'bg-danger text-white'
                                            }`}
                                    >
                                        {equipment.is_active ? <FaCheck /> : <FaTimes />}
                                    </div>
                                </TableCell>
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
                                                        prepareData(equipment, 'edit');
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
                                                        onDelete?.(equipment);
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
                                                prepareData(equipment, 'view');
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
                <div className={`equipment-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
                    {equipments.map((equipment) => (
                        <Card
                            key={`card-${equipment.id}`}
                            className="bg-background border border-border"
                        >
                            <CardBody className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-text">
                                            {equipment.name}
                                        </h3>
                                        <p className="text-sm text-textMuted">{equipment.type}</p>
                                    </div>
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center ${equipment.is_active
                                            ? 'bg-success text-white'
                                            : 'bg-danger text-white'
                                            }`}
                                    >
                                        {equipment.is_active ? <FaCheck size={12} /> : <FaTimes size={12} />}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Chip
                                        size="sm"
                                        color={getAvailabilityColor(equipment.availability)}
                                        variant="flat"
                                    >
                                        {formatAvailability(equipment.availability)}
                                    </Chip>
                                </div>

                                {equipment.description && (
                                    <p className="text-sm text-textMuted line-clamp-2">
                                        {equipment.description}
                                    </p>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
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
                                                        prepareData(equipment, 'edit');
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
                                                        onDelete?.(equipment);
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
                                                prepareData(equipment, 'view');
                                            }}
                                        >
                                            <FaEye className="text-white" />
                                        </Button>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
};

export default EquipmentList;

