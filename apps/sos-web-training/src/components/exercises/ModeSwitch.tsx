'use client';

import { useSwitch, VisuallyHidden } from '@heroui/react';
import { CiCircleList, CiViewTable } from 'react-icons/ci';

interface ModeSwitchProps {
  isSelected: boolean;
  onValueChange: (value: boolean) => void;
}

export const ModeSwitch = ({ isSelected, onValueChange }: ModeSwitchProps) => {
  const { Component, slots, getBaseProps, getInputProps, getWrapperProps } = useSwitch({
    isSelected,
    onValueChange,
  });

  return (
    <div className="flex flex-col gap-2">
      <Component {...getBaseProps()}>
        <VisuallyHidden>
          <input {...getInputProps()} />
        </VisuallyHidden>
        <div
          {...getWrapperProps()}
          className={slots.wrapper({
            class: [
              'w-10 h-10',
              'flex items-center justify-center',
              'rounded-lg border border-border',
              'bg-background text-text group-data-[selected=true]:bg-background group-data-[selected=true]:text-text',
            ],
          })}
        >
          {isSelected ? <CiViewTable className="w-6 h-6" /> : <CiCircleList className="w-6 h-6" />}
        </div>
      </Component>
    </div>
  );
};
