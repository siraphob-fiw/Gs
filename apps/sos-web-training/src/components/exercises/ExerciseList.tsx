'use client';

import React from 'react';
import { ExerciseWithUser, UpdateExerciseRequest } from '@strengthos/shared-types';
import {
  Card,
  Button,
  CardBody,
  Accordion,
  AccordionItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableColumn,
  TableHeader,
  SortDescriptor,
} from '@heroui/react';
import { FaCheck, FaDumbbell, FaPencil } from 'react-icons/fa6';
import { FaEye, FaTimes, FaTrash } from 'react-icons/fa';
import dayjs from 'dayjs';

export interface ExerciseListProps {
  exercises: ExerciseWithUser[];
  className?: string;
  onEdit?: (exercise: UpdateExerciseRequest) => void;
  onDelete?: (exercise: ExerciseWithUser) => void;
  onView?: (exercise: UpdateExerciseRequest) => void;
  ableToAction?: boolean;
  canApprove?: (exerciseid: string) => void;
  mode?: 'table' | 'card';
  sortDescriptor?: SortDescriptor;
  onSortChange?: (sortDescriptor: SortDescriptor) => void;
}

export const ExerciseList = ({
  exercises,
  className = '',
  onEdit,
  onDelete,
  onView,
  ableToAction,
  canApprove,
  mode = 'card',
  sortDescriptor,
  onSortChange,
}: ExerciseListProps) => {
  if (exercises.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-textMuted">
          <FaDumbbell className="mx-auto h-12 w-12 text-textMuted" />
          <h3 className="mt-2 font-medium text-text">No exercises found</h3>
        </div>
      </div>
    );
  }

  const prepareData = (exercise: ExerciseWithUser, type: 'edit' | 'view') => {
    const payload = {
      id: exercise.id,
      name: exercise.name,
      exerciseType: exercise.exerciseType,
      experienceLevel: exercise.experienceLevel,
      movementPatterns: exercise.movementPatterns,
      bodyPartFocus: exercise.bodyPartFocus,
      disciplineTags: exercise.disciplineTags,
      centralStressFactor: exercise.centralStressFactor,
      peripheralStressFactor: exercise.peripheralStressFactor,
      injuryContraindications: exercise.injuryContraindications,
      popularityScore: exercise.popularityScore,
      effectivenessRating: exercise.effectivenessRating,
      techniqueComplexity: exercise.techniqueComplexity,
      is_approved: exercise.is_approved,
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
      {mode == 'table' ? (
        <Table
          aria-label="Exercises Table"
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
            <TableColumn key="exerciseType" align="center" allowsSorting>
              Exercise Type
            </TableColumn>
            <TableColumn key="is_approved" align="center">
              Status
            </TableColumn>
            <TableColumn align="center" style={{ width: '100px' }}>
              Actions
            </TableColumn>
          </TableHeader>
          <TableBody>
            {exercises.map((exercise) => (
              <TableRow key={`table-${exercise.id}`}>
                <TableCell>{dayjs(exercise.createdAt).format('MM/DD/YYYY')}</TableCell>
                <TableCell>{exercise.name}</TableCell>
                <TableCell>
                  {exercise.exerciseType
                    ?.replaceAll('_', ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </TableCell>
                <TableCell>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto ${exercise.is_approved ? 'bg-success text-white' : 'bg-danger text-white'
                      }`}
                  >
                    {exercise.is_approved ? <FaCheck /> : <FaTimes />}
                  </div>
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  {!exercise.is_approved && ableToAction && canApprove && (
                    <Button
                      variant="solid"
                      size="sm"
                      color="success"
                      onPress={() => {
                        canApprove?.(exercise.id);
                      }}
                      isIconOnly
                    >
                      <FaCheck className="text-white" />
                    </Button>
                  )}
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
                            prepareData(exercise, 'edit');
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
                            onDelete?.(exercise);
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
                        prepareData(exercise, 'view');
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
        <div className={`exercise-list space-y-4 ${className}`}>
          {exercises.map((exercise) => {
            return (
              <Card
                key={`card-${exercise.id}`}
                className={`exercise-item transition-all duration-200 bg-background border border-border`}
              >
                <CardBody>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <h3 className="text-lg font-medium text-text">{exercise.name}</h3>
                      <div
                        className={`inline-flex items-center justify-center rounded-full p-1 text-xs font-medium ${exercise.is_approved ? 'bg-success text-white' : 'bg-danger text-white'
                          }`}
                        style={{ minWidth: 24, minHeight: 24 }}
                      >
                        {exercise.is_approved ? <FaCheck /> : <FaTimes />}
                      </div>
                    </div>
                    <div className="w-full md:w-auto flex items-center gap-2 justify-end">
                      {ableToAction && canApprove && !exercise.is_approved && (
                        <Button
                          color="success"
                          variant="solid"
                          className="text-white"
                          size="sm"
                          onPress={() => {
                            canApprove?.(exercise.id);
                          }}
                        >
                          Approve
                        </Button>
                      )}
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
                                prepareData(exercise, 'edit');
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
                                onDelete?.(exercise);
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
                            prepareData(exercise, 'view');
                          }}
                        >
                          <FaEye className="text-white" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Accordion className="w-full px-0">
                    <AccordionItem
                      key={exercise.id}
                      aria-label={`${exercise.name} Details`}
                      title={<div className="text-sm text-text">Details</div>}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-text mb-3">
                        <div>
                          <span className="font-medium">Exercise Type:</span>
                          <span className="ml-2">
                            {exercise.exerciseType
                              .replaceAll('_', ' ')
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Movement Patterns:</span>
                          <span className="ml-2">
                            {exercise.movementPatterns.join(', ').replaceAll('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Disciplines:</span>
                          <span className="ml-2">
                            {exercise.disciplineTags.join(', ').replaceAll('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Body Part Focus:</span>
                          <span className="ml-2">
                            {exercise.bodyPartFocus.join(', ').replaceAll('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Central Stress Factor:</span>
                          <div className="mt-1">{exercise.centralStressFactor}/10</div>
                        </div>
                        <div>
                          <span className="font-medium">Peripheral Stress Factor:</span>
                          <div className="mt-1">{exercise.peripheralStressFactor}/10</div>
                        </div>
                        <div>
                          <span className="font-medium">Popularity Score:</span>
                          <div className="mt-1">{exercise.popularityScore}/10</div>
                        </div>
                        <div>
                          <span className="font-medium">Effectiveness Rating:</span>
                          <div className="mt-1">{exercise.effectivenessRating}/10</div>
                        </div>
                        <div>
                          <span className="font-medium">Technique Complexity:</span>
                          <div className="mt-1">{exercise.techniqueComplexity}/10</div>
                        </div>
                        <div>
                          <span className="font-medium">Approved By:</span>
                          <div className="mt-1">{exercise.approvedBy}</div>
                        </div>
                        <div>
                          <span className="font-medium">Approved At:</span>
                          <div className="mt-1">
                            {exercise.approvedAt
                              ? new Date(exercise.approvedAt).toLocaleDateString()
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </AccordionItem>
                  </Accordion>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default ExerciseList;
