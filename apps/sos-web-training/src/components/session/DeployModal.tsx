import React from 'react';
import { Button, Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import { FaTimes } from 'react-icons/fa';
import { TrainingSessionBuilder } from '@/types/global';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDay: number;
  trainingSessionBuilder: TrainingSessionBuilder;
  onCopyDay: (fromDay: number, toDay: number) => void;
}

export function DeployModal({
  isOpen,
  onClose,
  sourceDay,
  trainingSessionBuilder,
  onCopyDay,
}: DeployModalProps) {
  const daysWithExercises = new Set(trainingSessionBuilder.exercises.map((ex) => ex.day));

  return (
    <Modal
      className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="2xl"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      hideCloseButton
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center gap-4">
          <div className="text-2xl font-semibold text-text">Select Day</div>
          <Button isIconOnly variant="solid" color="danger" onPress={onClose}>
            <FaTimes />
          </Button>
        </ModalHeader>
        <ModalBody className="py-4">
          <div className="flex flex-wrap justify-center items-center gap-2">
            {Array.from({ length: 7 }).map((_, index) => {
              const targetDay = index + 1;
              const isDisabled =
                targetDay === sourceDay ||
                (daysWithExercises.size >= 4 && !daysWithExercises.has(targetDay));
              return (
                <Button
                  key={targetDay}
                  variant="bordered"
                  color={targetDay === sourceDay ? 'success' : 'primary'}
                  isDisabled={isDisabled}
                  onPress={() => {
                    onCopyDay(sourceDay, targetDay);
                    onClose();
                  }}
                >
                  Day {targetDay}
                </Button>
              );
            })}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
