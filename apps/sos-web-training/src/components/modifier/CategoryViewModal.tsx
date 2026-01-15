'use client';

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from '@heroui/react';
import { StatusBadge } from './StatusBadge';
import dayjs from 'dayjs';
import { ModifierCategory } from '@/hooks/api/use-modifier';

interface CategoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ModifierCategory | null;
}

export function CategoryViewModal({ isOpen, onClose, category }: CategoryViewModalProps) {
  if (!category) return null;

  return (
    <Modal
      backdrop="blur"
      className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
      isOpen={isOpen}
      onOpenChange={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span className="text-text">Category Details</span>
        </ModalHeader>
        <ModalBody className="p-4">
          <div className="space-y-4">
            {/* Modifier Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">Name</label>
              <div className="p-3 bg-background rounded-lg border border-border">
                <span className="text-text font-medium">{category.name}</span>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Textarea
                label={'Description'}
                labelPlacement='outside'
                variant="bordered"
                classNames={{
                  description: 'text-textMuted',
                  inputWrapper: 'bg-background border-1 group-data-[focus=true]:border-info',
                  label: 'text-text',  
                  input: 'text-text',
                }}
                value={category.description ?? ''}
              />
            </div>

            {/* Status */}
            <div className="flex gap-2 justify-between items-center">
              <span className="text-sm font-medium text-muted">Status</span>
              <StatusBadge status={category.status} />
            </div>

            {/* Created At */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted">Created At</span>
              <div className="p-3 bg-background rounded-lg border border-border">
                <span className="text-text">
                  {dayjs(category.created_at).format('MMMM D, YYYY HH:mm')}
                </span>
              </div>
            </div>

            {/* Updated At */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted">Last Updated</span>
              <div className="p-3 bg-background rounded-lg border border-border">
                <span className="text-text">
                  {dayjs(category.updated_at).format('MMMM D, YYYY HH:mm')}
                </span>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="solid" color="primary" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
