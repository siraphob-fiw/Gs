'use client';

import { TrainingSessionBuilder } from '@/types/global';
import {
  Button,
  Calendar,
  PopoverTrigger,
  Popover,
  RangeValue,
  PopoverContent,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { FaTimes } from 'react-icons/fa';

const CalendarIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

export function WeekSelectionCalendar({
  trainingSessionBuilder,
  onChange,
  error,
  onRemoveWeek,
}: {
  trainingSessionBuilder: TrainingSessionBuilder;
  onChange: (date: { start: string, end: string }) => void;
  onRemoveWeek: (dateRange: any) => void;
  error: boolean;
}) {
  const handleDateChange = (dateValue: any) => {
    // convert from iso to UTC manually (since .utc() is not available)
    const date = dayjs(dateValue);
    const startDate = dayjs(date.startOf('day')).format('YYYY-MM-DD');
    const endDate = dayjs(date.endOf('day').add(6, 'day')).format('YYYY-MM-DD');

    onChange({ start: startDate, end: endDate });
  };

  const isDateUnavailable = (date: Date) => {
    const targetTime = dayjs(date).startOf('day').toDate();
    return trainingSessionBuilder.date.some((dateRange) => {
      const start = dayjs(dateRange.start_date).startOf('day').toDate();
      const end = dayjs(dateRange.end_date).endOf('day').toDate();
      return targetTime >= start && targetTime <= end;
    });
  };

  const handleRemoveWeek = (dateRange: any) => {
    onRemoveWeek?.(dateRange);
  };

  return (
    <Popover
      classNames={{
        content: 'flex flex-col gap-2 p-0 bg-backgroundSecondary border border-border shadow-lg',
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="bordered"
          className={`${error ? 'border-danger' : 'border-border'} text-text bg-background h-14`}
        >
          <CalendarIcon />
          {trainingSessionBuilder.date.length === 1 ? (
            <div className="flex gap-1 items-start text-xs">
              {dayjs(trainingSessionBuilder.date[0].start_date).format('MMM DD')} -{' '}
              {dayjs(trainingSessionBuilder.date[0].end_date).format('MMM DD, YYYY')}
            </div>
          ) : trainingSessionBuilder.date.length > 1 ? (
            <div className="flex gap-1 items-start text-xs">
              Selected Weeks: {trainingSessionBuilder.date.length}
            </div>
          ) : (
            <div className="text-text ml-2">Select date to deploy</div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <>
          <Calendar
            value={null}
            onChange={handleDateChange}
            minValue={parseDate(dayjs().format('YYYY-MM-DD').toString())}
            isDateUnavailable={(date) =>
              isDateUnavailable(dayjs((date as any).toString()).toDate())
            }
            classNames={{
              cellButton: [
                'text-text',
                'data-[disabled=true]:text-textMuted',
                'data-[today=true]:border',
                'data-[today=true]:border-primary',
                'data-[unavailable=true]:text-white',
                'data-[unavailable=true]:border',
                'data-[unavailable=true]:bg-success',
                'data-[unavailable=true]:border-success',
                'data-[unavailable=true]:no-underline',
              ].join(' '),
              base: 'bg-backgroundSecondary',
              headerWrapper: 'bg-backgroundSecondary',
              gridHeaderRow: 'bg-backgroundSecondary p-2',
              prevButton: 'text-text',
              nextButton: 'text-text',
              pickerItem: 'text-text',
            }}
          />
          {trainingSessionBuilder.date.length > 0 && (
            <div className="w-full mt-2 p-4 border-t border-border">
              <div className="text-sm text-text font-semibold">Selected Weeks:</div>
              <div className="flex flex-col gap-1">
                {trainingSessionBuilder.date
                  .sort(
                    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
                  )
                  .map((dateRange, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 text-xs text-white"
                    >
                      <div className="flex items-center gap-1 text-text">
                        {dayjs(dateRange.start_date).format('MMM DD')} -{' '}
                        {dayjs(dateRange.end_date).format('MMM DD, YYYY')}
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="solid"
                        color="danger"
                        onPress={() => handleRemoveWeek(dateRange)}
                      >
                        <FaTimes className="text-white" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      </PopoverContent>
    </Popover>
  );
}
