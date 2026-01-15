import React from 'react';
import { Input, SelectItem } from '@heroui/react';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { WeekSelectionCalendar } from '@/components/forms/WeekSelectionCalendar';
import { TrainingSessionBuilder } from '@/types/global';
import { UserResponse } from '@/hooks/api/use-users';
import dayjs from 'dayjs';

interface SessionFormFieldsProps {
  trainingSessionBuilder: TrainingSessionBuilder;
  onUpdateBuilder: (updater: (prev: TrainingSessionBuilder) => TrainingSessionBuilder) => void;
  errors: string[];
  onErrorChange: (errors: string[]) => void;
  selectedTrainingBlock: string;
  onSelectTrainingBlock: (blockId: string) => void;
  trainingBlocks: Array<{ id: string; workoutName: string }>;
  isAdmin: boolean;
  availableCoaches: UserResponse[];
  filteredAthletes: Array<{
    athlete_id: string;
    athlete_firstName: string;
    athlete_lastName: string;
  }>;
  onSelectAthlete: (athleteId: string) => void;
}

export function SessionFormFields({
  trainingSessionBuilder,
  onUpdateBuilder,
  errors,
  onErrorChange,
  selectedTrainingBlock,
  onSelectTrainingBlock,
  trainingBlocks,
  isAdmin,
  availableCoaches,
  filteredAthletes,
  onSelectAthlete,
}: SessionFormFieldsProps) {
  const handleDateChange = (dateValue: { start: string, end: string }) => {
    if (!dateValue) return;
    const weekStart = dateValue.start;
    const weekEnd = dateValue.end;


    const isWeekSelected = trainingSessionBuilder.date.some((dateRange) => {
      const rangeStartTime = dateRange.start_date;
      const rangeEndTime = dateRange.end_date;
      return rangeStartTime === weekStart && rangeEndTime === weekEnd;
    });

    onErrorChange(errors.filter((error) => error !== 'date'));

    if (isWeekSelected) {
      onUpdateBuilder((prev) => ({
        ...prev,
        date: prev.date.filter((dateRange) => {
          const rangeStartTime = dateRange.start_date;
          const rangeEndTime = dateRange.end_date;
          return !(rangeStartTime === weekStart && rangeEndTime === weekEnd);
        }),
      }));
    } else {
      onUpdateBuilder((prev) => ({
        ...prev,
        date: [
          ...prev.date,
          {
            start_date: weekStart,
            end_date: weekEnd,
          },
        ],
      }));
    }
  };

  const handleRemoveWeek = (dateRange: { start_date: string; end_date: string }) => {
    onUpdateBuilder((prev) => ({
      ...prev,
      date: prev.date.filter(
        (date) => date.start_date !== dateRange.start_date && date.end_date !== dateRange.end_date,
      ),
    }));
  };

  return (
    <div className="p-4 rounded-md bg-backgroundSecondary border border-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trainingBlocks.length > 0 && (
          <SelectWithClassName
            fullWidth
            id="training-block"
            label="Available blocks"
            selectedKeys={selectedTrainingBlock !== '' ? [selectedTrainingBlock] : []}
            onSelectionChange={(keys) => {
              onSelectTrainingBlock(keys.currentKey || '');
            }}
            classNames={{
              trigger: 'bg-background border-border data-[open=true]:border-border',
              label: 'text-foreground-500',
              value: 'text-text group-data-[has-value=true]:text-text',
            }}
            selectorIconColor="text-text"
            listboxProps={{
              emptyContent: <div className="text-foreground-500">No blocks available</div>,
            }}
          >
            {trainingBlocks.map((trainingBlock) => (
              <SelectItem key={trainingBlock.id} textValue={trainingBlock.workoutName}>
                {trainingBlock.workoutName}
              </SelectItem>
            ))}
          </SelectWithClassName>
        )}

        <Input
          classNames={{
            inputWrapper: 'border-border group-data-[focus=true]:border-text bg-background',
          }}
          variant="bordered"
          label="Training Session Name"
          value={trainingSessionBuilder.session_name}
          onChange={(e) => {
            onErrorChange(errors.filter((error) => error !== 'session_name'));
            onUpdateBuilder((prev) => ({
              ...prev,
              session_name: e.target.value,
            }));
          }}
          isRequired
          isInvalid={errors.includes('session_name')}
        />

        {isAdmin && (
          <SelectWithClassName
            fullWidth
            isRequired
            id="coach"
            label="Coach"
            isInvalid={errors.includes('coach_id')}
            selectedKeys={trainingSessionBuilder.coach_id ? [trainingSessionBuilder.coach_id] : []}
            onSelectionChange={(e) => {
              onUpdateBuilder((prev) => ({
                ...prev,
                coach_id: e.currentKey || '',
              }));
            }}
            placeholder="Select Coach"
            classNames={{
              trigger: 'bg-background border-border data-[open=true]:border-border',
              label: 'text-text',
              value: 'text-text group-data-[has-value=true]:text-text',
            }}
            selectorIconColor="text-text"
          >
            {availableCoaches.map((coach) => (
              <SelectItem
                key={coach.id}
                textValue={`${coach.profile.firstName} ${coach.profile.lastName}`}
              >
                {coach.profile.firstName} {coach.profile.lastName}
              </SelectItem>
            ))}
          </SelectWithClassName>
        )}

        {trainingSessionBuilder.coach_id !== '' && (
          <SelectWithClassName
            fullWidth
            isRequired
            isInvalid={errors.includes('athlete_id')}
            id="athlete"
            label="Athlete"
            selectedKeys={
              trainingSessionBuilder.athlete_id ? [trainingSessionBuilder.athlete_id] : []
            }
            onSelectionChange={(e) => {
              onSelectAthlete(e.currentKey || '');
            }}
            placeholder="Select Athlete"
            classNames={{
              trigger: 'bg-background border-border data-[open=true]:border-border',
              label: 'text-text',
              value: 'text-text group-data-[has-value=true]:text-text',
            }}
            selectorIconColor="text-text"
          >
            {filteredAthletes.map((athlete) => (
              <SelectItem
                key={athlete.athlete_id}
                textValue={`${athlete.athlete_firstName} ${athlete.athlete_lastName}`}
              >
                {athlete.athlete_firstName} {athlete.athlete_lastName}
              </SelectItem>
            ))}
          </SelectWithClassName>
        )}

        <WeekSelectionCalendar
          trainingSessionBuilder={trainingSessionBuilder}
          onChange={handleDateChange}
          onRemoveWeek={handleRemoveWeek}
          error={errors.includes('date')}
        />
      </div>
    </div>
  );
}
