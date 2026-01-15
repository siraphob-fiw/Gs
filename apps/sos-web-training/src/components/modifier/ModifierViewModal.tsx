'use client';

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Modifier, ModifierCategory } from '@/hooks/api/use-modifier';
import { StatusBadge } from './StatusBadge';
import dayjs from 'dayjs';

interface ModifierViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  modifier: Modifier | null;
  category?: ModifierCategory;
}

export function ModifierViewModal({ isOpen, onClose, modifier, category }: ModifierViewModalProps) {
  if (!modifier) return null;

  return (
    <Modal
      backdrop="blur"
      className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
      isOpen={isOpen}
      onOpenChange={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span className="text-text">Modifier Details</span>
        </ModalHeader>
        <ModalBody className="p-4">
          <div className="space-y-4">
            {/* Modifier Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">Name</label>
              <div className="p-3 bg-background rounded-lg border border-border">
                <span className="text-text font-medium">{modifier.name}</span>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">Category</label>
              <div className="p-3 bg-background rounded-lg border border-border">
                <span className="text-text">{category?.name ?? 'Unknown Category'}</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex gap-2 justify-between items-center">
              <span className="text-sm font-medium text-muted">Status</span>
              <StatusBadge status={modifier.status} />
            </div>

            {/* Created At */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted">Created At</span>
              <div className="p-3 bg-background rounded-lg border border-border">
                <span className="text-text">
                  {dayjs(modifier.created_at).format('MMMM D, YYYY HH:mm')}
                </span>
              </div>
            </div>

            {/* Updated At */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted">Last Updated</span>
              <div className="p-3 bg-background rounded-lg border border-border">
                <span className="text-text">
                  {dayjs(modifier.updated_at).format('MMMM D, YYYY HH:mm')}
                </span>
              </div>
            </div>

            {/* Central Stress Factor */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted">Central Stress Factor</span>
              <div className="p-3 bg-background rounded-lg border border-border">
                <span className="text-text">{modifier.central_stress_factor}</span>
              </div>
            </div>

            {/* Peripheral Stress Factor */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted">Peripheral Stress Factor</span>
              <div className="p-3 bg-background rounded-lg border border-border">
                <span className="text-text">{modifier.peripheral_stress_factor}</span>
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
