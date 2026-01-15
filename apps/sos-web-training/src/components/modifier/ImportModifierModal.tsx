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
import { processFileData } from '@/utils/file-parser';
import {
  BulkUpdateModifierDto,
  CreateModifierDto,
  ModifierCategory,
} from '@/hooks/api/use-modifier';

interface ImportModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (modifiers: BulkUpdateModifierDto[]) => Promise<void>;
  categories: ModifierCategory[];
}

// Initial modifier template for field mapping
const initialModifier: CreateModifierDto = {
  name: '',
  modifier_category_id: '',
  central_stress_factor: 0,
  peripheral_stress_factor: 0,
};

export const ImportModifierModal = ({
  isOpen,
  onClose,
  onImport,
  categories,
}: ImportModifierModalProps) => {
  const [bulkImportData, setBulkImportData] = useState<string[]>([]);
  const [parsedCsvRows, setParsedCsvRows] = useState<Record<string, string>[]>([]);
  const [importToPayload, setImportToPayload] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const modifierKeys = useMemo(
    () => Object.keys(initialModifier).filter((key) => key !== 'status'),
    [],
  );

  // Build a map for category name -> id lookup
  const categoryNameToId = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat) => {
      map[cat.name.toLowerCase().trim()] = cat.id;
    });
    return map;
  }, [categories]);

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
      modifierKeys.forEach((payloadKey) => {
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

    const getMappedVal = (modifierKey: string, row: Record<string, string>) => {
      const mappedColumn = importToPayload[modifierKey];
      if (!mappedColumn) return undefined;
      let value = row[mappedColumn];
      if (typeof value === 'string') {
        value = value.replace(/[{}]/g, '');
        return value.trim();
      }
      return value;
    };

    const parseNumber = (val: any, fallback: number = 0) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return Number(val);
      return fallback;
    };

    const payload: CreateModifierDto[] = parsedCsvRows
      .filter((row) => Object.values(row).some((val) => String(val ?? '').trim().length > 0))
      .map((row) => {
        // Try to resolve category: first check if it's a UUID, otherwise lookup by name
        const categoryValue = getMappedVal('modifier_category_id', row) || '';
        let categoryId = categoryValue;

        // If not a UUID format, try to match by category name
        if (categoryValue && !categoryValue.match(/^[0-9a-f-]{36}$/i)) {
          const matchedId = categoryNameToId[categoryValue.toLowerCase().trim()];
          if (matchedId) {
            categoryId = matchedId;
          }
        }

        const modifier: CreateModifierDto = {
          name: getMappedVal('name', row) || 'Untitled Modifier',
          modifier_category_id: categoryId || categories[0]?.id || '',
          central_stress_factor: parseNumber(getMappedVal('central_stress_factor', row), 0),
          peripheral_stress_factor: parseNumber(getMappedVal('peripheral_stress_factor', row), 0),
        };
        return modifier;
      })
      .filter((m) => m.name && m.modifier_category_id);

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

  // Display friendly label for keys
  const getDisplayLabel = (key: string) => {
    const labels: Record<string, string> = {
      name: 'Name',
      modifier_category_id: 'Category (name or ID)',
      central_stress_factor: 'Central Stress Factor',
      peripheral_stress_factor: 'Peripheral Stress Factor',
    };
    return labels[key] || key.replace(/_/g, ' ');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
    >
      <ModalContent>
        <ModalHeader>Import Modifiers</ModalHeader>
        <ModalBody>
          <Input
            label="Bulk import modifiers from a CSV or Excel file"
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
            <div className="flex flex-col gap-2 mt-4">
              <p className="text-sm text-muted mb-2">Map your file columns to modifier fields:</p>
              {modifierKeys.map((payloadKey) => (
                <div key={payloadKey} className="flex items-center gap-2">
                  <div className="text-sm text-text flex-1 capitalize break-all">
                    {getDisplayLabel(payloadKey)}
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
                          [payloadKey]: e.currentKey ?? '',
                        }));
                      }}
                      classNames={{
                        trigger: 'bg-backgroundSecondary data-[open=true]:border-border',
                        value: 'text-text group-data-[has-value=true]:text-text',
                        listbox:
                          'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
                      }}
                    >
                      {bulkImportData.map((header) => (
                        <SelectItem key={header} textValue={header}>
                          {header.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectWithClassName>
                  </div>
                </div>
              ))}

              {parsedCsvRows.length > 0 && (
                <p className="text-sm text-muted mt-2">
                  Found {parsedCsvRows.length} row(s) to import.
                </p>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleBulkImport}
            isLoading={isProcessing}
            isDisabled={parsedCsvRows.length === 0}
          >
            Import
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
