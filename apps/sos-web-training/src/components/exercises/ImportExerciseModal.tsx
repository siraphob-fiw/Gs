'use client';

import { useMemo, useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalContent,
  ModalFooter,
  Button,
  Input,
  SelectItem,
} from '@heroui/react';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import { CreateExerciseRequest } from '@strengthos/shared-types';
import { processFileData } from '@/utils/file-parser';
import { ExerciseCategory } from '@/hooks/api/use-exercise-categories';

interface ImportExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (exercises: CreateExerciseRequest[]) => Promise<void>;
  initialExercise: CreateExerciseRequest;
  categories?: ExerciseCategory[];
}

export const ImportExerciseModal = ({
  isOpen,
  onClose,
  onImport,
  initialExercise,
  categories = [],
}: ImportExerciseModalProps) => {
  const [bulkImportData, setBulkImportData] = useState<string[]>([]);
  const [parsedCsvRows, setParsedCsvRows] = useState<Record<string, string>[]>([]);
  const [importToPayload, setImportToPayload] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const exerciseKeys = useMemo(
    () => Object.keys(initialExercise).filter((key) => key !== 'popularityScore'),
    [initialExercise],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    setIsProcessing(true);
    setBulkImportData([]);
    setParsedCsvRows([]);
    setImportToPayload({});

    try {
      const { headers, rows } = await processFileData(e.target.files[0]);

      if (headers.length === 0) {
        return;
      }

      setBulkImportData(headers);
      setParsedCsvRows(rows);

      // Auto-map headers to payload keys
      const suggestedImportToPayload: Record<string, string> = {};
      exerciseKeys.forEach((payloadKey) => {
        const normalizedPayloadKey = payloadKey.toLowerCase().replace(/[\s_]/g, '');
        const matchedHeader = headers.find(
          (header) =>
            header.toLowerCase().replace(/[\s_]/g, '').includes(normalizedPayloadKey) ||
            normalizedPayloadKey.includes(header.toLowerCase().replace(/[\s_]/g, '')),
        );
        if (matchedHeader) {
          suggestedImportToPayload[payloadKey] = matchedHeader;
        }
      });
      setImportToPayload(suggestedImportToPayload);
    } catch (error) {
      console.error('File parsing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkImport = async () => {
    if (parsedCsvRows.length === 0) return;

    if (
      !Object.values(importToPayload).some((val) => typeof val === 'string' && val.length > 0) ||
      bulkImportData.length === 0
    ) {
      return;
    }

    const getMappedVal = (exerciseKey: string, row: Record<string, string>) => {
      const mappedColumn = importToPayload[exerciseKey];
      if (!mappedColumn) return undefined;
      let value = row[mappedColumn];
      if (typeof value === 'string') {
        value = value.replace(/[{}]/g, '');
        return value.trim();
      }
      return value;
    };

    const parseNumber = (val: any, fallback: number | undefined = undefined) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return Number(val);
      return fallback;
    };

    const parseArray = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim() !== '') {
        return val
          .split(',')
          .map((x: string) => x.trim())
          .filter(Boolean);
      }
      return [];
    };

    const payload: CreateExerciseRequest[] = parsedCsvRows
      .filter((row) => Object.values(row).some((val) => String(val ?? '').trim().length > 0))
      .map((row) => {
        const exercise: CreateExerciseRequest = {
          name: getMappedVal('name', row) || 'Untitled Exercise',
          exerciseType: getMappedVal('exerciseType', row) || '',
          movementPatterns: parseArray(getMappedVal('movementPatterns', row)),
          bodyPartFocus: parseArray(getMappedVal('bodyPartFocus', row)),
          disciplineTags: parseArray(getMappedVal('disciplineTags', row)),
          centralStressFactor: parseNumber(getMappedVal('centralStressFactor', row), 5) as number,
          peripheralStressFactor: parseNumber(
            getMappedVal('peripheralStressFactor', row),
            5,
          ) as number,
          injuryContraindications: parseArray(getMappedVal('injuryContraindications', row)),
          popularityScore: 0,
          effectivenessRating: parseNumber(getMappedVal('effectivenessRating', row), 0) as number,
          techniqueComplexity: parseNumber(getMappedVal('techniqueComplexity', row), 1) as number,
          experienceLevel: (['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'].includes(
            (getMappedVal('experienceLevel', row) || '').toUpperCase(),
          )
            ? (getMappedVal('experienceLevel', row) || '').toUpperCase()
            : 'BEGINNER') as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE',
        };
        return exercise;
      });

    if (payload.length === 0) return;

    await onImport(payload);
    handleClose();
  };

  const handleClose = () => {
    setBulkImportData([]);
    setParsedCsvRows([]);
    setImportToPayload({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
    >
      <ModalContent>
        <ModalHeader>Import Exercises</ModalHeader>
        <ModalBody>
          <Input
            label="Bulk import exercises from a CSV or Excel file"
            labelPlacement="outside-top"
            placeholder="Select a file to import"
            variant="bordered"
            isRequired
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple={false}
            isDisabled={isProcessing}
            classNames={{
              inputWrapper:
                'bg-backgroundSecondary border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary',
              input: 'text-text group-data-[has-value=true]:text-text',
            }}
            onChange={handleFileChange}
          />

          {bulkImportData.length > 0 && (
            <div className="flex flex-col gap-2">
              {exerciseKeys.map((payloadKey) => (
                <div key={payloadKey} className="flex items-center gap-2">
                  <div className="text-sm text-text flex-1 capitalize break-all">
                    {payloadKey.replace(/_/g, ' ')}
                  </div>
                  <div className="flex-1">
                    <SelectWithClassName
                      aria-label="File column"
                      label=""
                      placeholder="Select file column"
                      variant="bordered"
                      selectedKeys={
                        importToPayload[payloadKey] ? [importToPayload[payloadKey]] : []
                      }
                      onSelectionChange={(e) => {
                        setImportToPayload((prev) => ({
                          ...prev,
                          [payloadKey]: e.currentKey as string,
                        }));
                      }}
                      classNames={{
                        trigger: 'bg-backgroundSecondary data-[open=true]:border-border',
                        value: 'text-text group-data-[has-value=true]:text-text',
                        listbox:
                          'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                      }}
                      children={
                        bulkImportData.map((header) => (
                          <SelectItem key={header} textValue={header}>
                            {header.replace(/_/g, ' ')}
                          </SelectItem>
                        ))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={handleBulkImport} isLoading={isProcessing}>
            Import
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
