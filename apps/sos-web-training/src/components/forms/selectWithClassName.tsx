import React, { useRef, useEffect } from 'react';
import { Select, SelectProps } from '@heroui/react';
import { FaCaretDown } from 'react-icons/fa';

interface SelectWithClassNameProps extends SelectProps {
  selectorIconColor?: string;
  fullwidth?: boolean;
  wrapperClassName?: string;
}

export const SelectWithClassName = ({ ...props }: SelectWithClassNameProps) => {
  return (
    <div className={`${props.wrapperClassName || ''} ${props.fullwidth ? 'w-full' : ''}`}>
      <Select
        ref={props.ref ?? null}
        id={props.id}
        {...props}
        scrollShadowProps={{
          isEnabled: false,
        }}
        classNames={{
          ...props.classNames,
          trigger: props.classNames?.trigger || 'bg-white',
          value: props.classNames?.value || 'text-black',
          listboxWrapper: props.classNames?.listboxWrapper || '',
        }}
        variant={props.variant || 'bordered'}
        popoverProps={{
          ...props.popoverProps,
          classNames: {
            ...props.popoverProps?.classNames,
            base: 'before:bg-backgroundSecondary z-[1001]',
            content: 'p-0 rounded-md z-[1001]',
          },
          shouldBlockScroll: false,
          shouldCloseOnBlur: true,
          isNonModal: true,
          placement: 'bottom-start',
          offset: 4,
          containerPadding: 0,
          shouldFlip: true,
          shouldCloseOnInteractOutside: (element: Element) => true,
        }}
        listboxProps={{
          ...props.listboxProps,
          classNames: {
            ...props.listboxProps?.classNames,
            base: [
              'rounded-md',
              'text-black',
              'transition-opacity',
              'data-[hover=true]:text-black',
              'data-[hover=true]:bg-backgroundSecondary',
              'dark:data-[hover=true]:bg-backgroundSecondary',
              'data-[selectable=true]:focus:bg-backgroundSecondary',
              'data-[pressed=true]:opacity-70',
              'data-[focus-visible=true]:ring-border',
            ],
          },
        }}
        selectorIcon={<FaCaretDown color={`${props.selectorIconColor || 'black'}`} />}
      >
        {props.children}
      </Select>
    </div>
  );
};
