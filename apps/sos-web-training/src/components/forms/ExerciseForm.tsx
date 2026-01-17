import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, SelectItem, Checkbox, CheckboxGroup, Divider, Switch } from '@heroui/react';
import { MovementPattern, Discipline, ExperienceLevel, Equipment } from '@strengthos/shared-types';
import { SelectWithClassName } from './selectWithClassName';
import { ExerciseCategory } from '@/hooks/api/use-exercise-categories';

export enum BodyPart {
  LEGS = 'legs',
  CORE = 'core',
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  ARMS = 'arms',
  FULL_BODY = 'full_body',
  ABDOMINALS = 'abdominals',
  ANTERIOR_DELTOIDS = 'anterior_deltoids',
  LATERAL_DELTOIDS = 'lateral_deltoids',
  POSTERIOR_DELTOIDS = 'posterior_deltoids',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  GLUTES = 'glutes',
  HAMSTRINGS = 'hamstrings',
  LOWER_BACK = 'lower_back',
  UPPER_BACK = 'upper_back',
  QUADS = 'quads',
  LATISSIMUS_DORSIS = 'latissimus_dorsis',
  RHOMBOIDS = 'rhomboids',
  LATS = 'lats',
  OBLIQUES = 'obliques',
  QUADRICEPS = 'quadriceps',
  ADDUCTORS = 'adductors',
  TRAPS = 'traps',
}

interface ExerciseFormProps {
  isEdit?: boolean;
  isReadonly?: boolean;
  data?: any;
  errors?: Record<string, string>;
  onSubmit: (data: any) => void | Promise<void>;
  categories?: ExerciseCategory[];
}

export const ExerciseForm = ({
  isEdit = false,
  isReadonly = false,
  onSubmit,
  data,
  errors,
  categories = [],
}: ExerciseFormProps) => {
  const defaultFormData = useMemo(
    () => ({
      name: '',
      exerciseType: '',
      movementPatterns: [],
      bodyPartFocus: [],
      disciplineTags: [],
      centralStressFactor: 0.1,
      peripheralStressFactor: 0.1,
      injuryContraindications: [],
      techniqueComplexity: 1,
      experienceLevel: 'BEGINNER' as ExperienceLevel,
      is_approved: false,
      needEquipment: [],
    }),
    [],
  );

  const [formData, setFormData] = useState(data || defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>(errors || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customPatternInput, setCustomPatternInput] = useState('');
  const [customInjury, setCustomInjury] = useState('');
  const [equipmentsData, setEquipmentsData] = useState<Equipment[]>([]);
  const [injuryContraindications, setInjuryContraindications] = useState([
    'SPRAIN',
    'STRAIN',
    'MUSCLE_TEAR',
    'FRACTURE',
    'DISLOCATION',
    'TENDONITIS',
    'CONTUSION',
    'SHIN_SPLINTS',
    'PLANTAR_FASCIITIS',
    'RUNNERS_KNEE',
  ]);

  // Helper function to normalize injury contraindication format
  const normalizeInjury = (injury: string): string => {
    return injury.trim().replaceAll(' ', '_').toUpperCase();
  };

  // Sync formData when data prop changes
  useEffect(() => {
    if (data) {
      // Normalize injury contraindications to match the format used in options
      const normalizedData = {
        ...data,
        injuryContraindications: data.injuryContraindications
          ? data.injuryContraindications
            .map((injury: string) => normalizeInjury(injury))
            .filter((injury: string) => injury && injury.trim() && injury !== '_')
          : [],
      };
      setFormData(normalizedData);

      // Add any custom injuries from data to the options list
      if (normalizedData.injuryContraindications) {
        setInjuryContraindications((prev) => {
          const existingOptions = new Set(prev);
          const customInjuries = normalizedData.injuryContraindications.filter(
            (injury: string) => !existingOptions.has(injury),
          );
          if (customInjuries.length > 0) {
            return [...prev, ...customInjuries];
          }
          return prev;
        });
      }
    } else {
      setFormData(defaultFormData);
    }
  }, [data, defaultFormData]);

  // Sync formErrors when errors prop changes
  useEffect(() => {
    if (errors) {
      setFormErrors(errors);
    }
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Only reset if not in edit mode (for create mode, reset to defaults)
      if (!isEdit && data) {
        setFormData(data);
      }
      setFormErrors({});
    } catch (error: any) {
      console.error('Failed to submit exercise:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-4">
        <div className="text-lg text-text">Exercise Details</div>
        {isEdit && (
          <Switch
            isSelected={formData?.is_approved || false}
            onValueChange={(value) => setFormData((prev: any) => ({ ...prev, is_approved: value }))}
            color={formData?.is_approved ? 'success' : 'danger'}
            classNames={{
              label: `${formData?.is_approved ? 'text-success' : 'text-text'}`,
            }}
            size="sm"
          >
            {formData?.is_approved ? 'Active' : 'Inactive'}
          </Switch>
        )}
      </div>
      <Input
        classNames={{
          inputWrapper: 'bg-surface group-data-[focus=true]:border-border',
          input: 'text-text',
          base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
        }}
        variant="bordered"
        label="Exercise Name"
        value={formData?.name || ''}
        onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
        isInvalid={formErrors.name ? true : false}
        errorMessage={formErrors.name}
        isRequired
        isDisabled={isReadonly}
      />

      <SelectWithClassName
        id="exercise-type"
        variant="bordered"
        label="Exercise Type"
        selectedKeys={formData?.exerciseType ? [formData.exerciseType] : []}
        disallowEmptySelection
        onSelectionChange={(keys) => {
          setFormData((prev: any) => ({
            ...prev,
            exerciseType: keys.currentKey as string || '',
          }));
        }}
        isInvalid={formErrors.exerciseType ? true : false}
        errorMessage={formErrors.exerciseType}
        isRequired
        isDisabled={isReadonly}
        selectorIconColor="text-text"
        classNames={{
          base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
          trigger: `bg-surface data-[open=true]:border-border ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
          value: `group-data-[has-value=true]:text-text ${isReadonly ? 'opacity-100' : ''}`,
          label: isReadonly ? 'opacity-100' : '',
          listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
        }}
        children={
          <>
            {categories.map((category) => (
              <SelectItem
                key={category.name}
                textValue={category.name}
              >
                {category.name}
              </SelectItem>
            ))}
          </>
        }
      />

      <Divider className="border-solid border-border" />

      {(() => {
        const enumValues = Object.values(MovementPattern);
        const currentValues = Array.isArray(formData?.movementPatterns)
          ? formData.movementPatterns
          : [];
        const customValues = currentValues.filter(
          (val: string) => !enumValues.includes(val as MovementPattern),
        );
        const allOptions = [...enumValues, ...customValues];

        return (
          <SelectWithClassName
            id="movement-patterns"
            label="Movement Patterns"
            variant="bordered"
            selectedKeys={currentValues.length > 0 ? new Set(currentValues) : new Set()}
            selectionMode="multiple"
            onSelectionChange={(keys) => {
              setFormData((prev: any) => ({
                ...prev,
                movementPatterns: Array.from(keys) as string[],
              }));
            }}
            isInvalid={formErrors.movementPatterns ? true : false}
            errorMessage={formErrors.movementPatterns}
            isRequired
            isDisabled={isReadonly}
            selectorIconColor="text-text"
            classNames={{
              base: isReadonly ? 'opacity-100 cursor-not-allowed' : '',
              trigger: `bg-surface data-[open=true]:border-border ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
              value: `group-data-[has-value=true]:text-text ${isReadonly ? 'opacity-100' : ''}`,
              label: isReadonly ? 'opacity-100' : '',
              listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
            }}
          >
            {allOptions.map((pattern) => (
              <SelectItem key={pattern}>
                {pattern
                  .replace('_', ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectWithClassName>
        );
      })()}

      {!isReadonly && (
        <div className="flex gap-2 items-center">
          <Input
            classNames={{
              inputWrapper: 'bg-surface group-data-[focus=true]:border-border',
              input: 'text-text',
            }}
            size="sm"
            variant="bordered"
            label="Add Custom Movement Pattern"
            placeholder="e.g., snatch or other"
            value={customPatternInput}
            onChange={(e) => setCustomPatternInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const inputValue = customPatternInput.trim();
                if (inputValue && !formData?.movementPatterns?.includes(inputValue)) {
                  setFormData((prev: any) => ({
                    ...prev,
                    movementPatterns: [...(prev.movementPatterns || []), inputValue],
                  }));
                  setCustomPatternInput('');
                }
              }
            }}
            className="flex-1"
          />
          <Button
            className="bg-primary text-surface"
            onPress={() => {
              const inputValue = customPatternInput.trim();
              if (inputValue && !formData?.movementPatterns?.includes(inputValue)) {
                setFormData((prev: any) => ({
                  ...prev,
                  movementPatterns: [...(prev.movementPatterns || []), inputValue],
                }));
                setCustomPatternInput('');
              }
            }}
            isDisabled={
              !customPatternInput.trim() ||
              formData?.movementPatterns?.includes(customPatternInput.trim())
            }
          >
            Add
          </Button>
        </div>
      )}

      <div className="w-full">
        <CheckboxGroup
          label="Body Parts Focus"
          value={formData?.bodyPartFocus || []}
          onValueChange={(value) =>
            setFormData((prev: any) => ({ ...prev, bodyPartFocus: value as BodyPart[] }))
          }
          isInvalid={formErrors.bodyPartFocus ? true : false}
          errorMessage={formErrors.bodyPartFocus}
          isDisabled={isReadonly}
          classNames={{
            label: `text-text ${isReadonly ? 'opacity-100' : ''}`,
            wrapper: `w-full ${isReadonly ? 'opacity-100' : ''}`,
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
            {Object.values(BodyPart).map((part) => (
              <Checkbox
                classNames={{
                  label: `text-text ${isReadonly ? 'opacity-100' : ''}`,
                  base: isReadonly ? 'opacity-100 cursor-not-allowed' : '',
                }}
                key={part}
                value={part}
                className="flex items-center"
              >
                {part
                  .replace('_', ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Checkbox>
            ))}
          </div>
        </CheckboxGroup>
      </div>

      <CheckboxGroup
        label="Discipline Tags"
        value={formData?.disciplineTags ?? []}
        onValueChange={(value) => {
          if (value.length === 0) {
            setFormData((prev: any) => ({ ...prev, disciplineTags: [] }));
          } else {
            setFormData((prev: any) => ({ ...prev, disciplineTags: value as Discipline[] }));
          }
        }}
        isInvalid={formErrors.disciplineTags ? true : false}
        errorMessage={formErrors.disciplineTags}
        isDisabled={isReadonly}
        classNames={{
          label: `text-text ${isReadonly ? 'opacity-100' : ''}`,
          wrapper: isReadonly ? 'opacity-100' : '',
        }}
      >
        {['BODYBUILDING', 'SPORTS_SPECIFIC', 'POWERBUILDING'].map((discipline) => (
          <Checkbox
            classNames={{
              label: `text-text ${isReadonly ? 'opacity-100' : ''}`,
              base: isReadonly ? 'opacity-100 cursor-not-allowed' : '',
            }}
            key={discipline}
            value={discipline}
          >
            {discipline
              .replace('_', ' ')
              .toLowerCase()
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </Checkbox>
        ))}
      </CheckboxGroup>

      <Divider className="border-solid border-border" />

      <div className="grid grid-cols-2 gap-4">
        <SelectWithClassName
          id="experience-level"
          label="Experience Level"
          selectedKeys={formData?.experienceLevel ? [formData.experienceLevel] : []}
          onSelectionChange={(keys: any) => {
            setFormData((prev: any) => ({
              ...prev,
              experienceLevel: keys.currentKey as ExperienceLevel,
            }));
          }}
          isDisabled={isReadonly}
          selectorIconColor="text-text"
          classNames={{
            base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
            trigger: `bg-surface data-[open=true]:border-border ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
            value: `group-data-[has-value=true]:text-text ${isReadonly ? 'opacity-100' : ''}`,
            label: isReadonly ? 'opacity-100' : '',
            listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
          }}
          children={
            <>
              {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map((level) => (
                <SelectItem key={level} textValue={level}>
                  {level}
                </SelectItem>
              ))}
            </>
          }
        />
        <Input
          classNames={{
            base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
            inputWrapper: `bg-surface ${isReadonly ? 'opacity-100' : ''}`,
            input: isReadonly ? 'opacity-100' : '',
            label: isReadonly ? 'opacity-100' : '',
          }}
          variant="bordered"
          label="Central Stress Factor"
          type="number"
          min="0.1"
          max="10"
          step="0.1"
          value={
            formData?.centralStressFactor !== undefined
              ? formData.centralStressFactor.toString()
              : '0'
          }
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
            setFormData((prev: any) => ({
              ...prev,
              centralStressFactor: value,
            }));
          }}
          isInvalid={formErrors.centralStressFactor ? true : false}
          errorMessage={formErrors.centralStressFactor}
          isDisabled={isReadonly}
          isRequired
        />
        <Input
          classNames={{
            base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
            inputWrapper: `bg-surface group-data-[focus=true]:border-border ${isReadonly ? 'opacity-100' : ''}`,
            input: `text-text ${isReadonly ? 'opacity-100' : ''}`,
            label: isReadonly ? 'opacity-100' : '',
          }}
          variant="bordered"
          label="Peripheral Stress Factor"
          type="number"
          min="0.1"
          max="10"
          step="0.1"
          value={formData?.peripheralStressFactor?.toString() || '0'}
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
            setFormData((prev: any) => ({ ...prev, peripheralStressFactor: value }));
          }}
          isInvalid={formErrors.peripheralStressFactor ? true : false}
          errorMessage={formErrors.peripheralStressFactor}
          isDisabled={isReadonly}
          isRequired
        />
        <Input
          classNames={{
            base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
            inputWrapper: `bg-surface group-data-[focus=true]:border-border ${isReadonly ? 'opacity-100' : ''}`,
            input: `text-text ${isReadonly ? 'opacity-100' : ''}`,
            label: isReadonly ? 'opacity-100' : '',
          }}
          variant="bordered"
          label="Technique Complexity Level"
          type="number"
          min="1"
          max="10"
          step="0.1"
          value={formData?.techniqueComplexity?.toString() || '1'}
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
            setFormData((prev: any) => ({ ...prev, techniqueComplexity: value }));
          }}
          isInvalid={formErrors.techniqueComplexity ? true : false}
          errorMessage={formErrors.techniqueComplexity}
          isDisabled={isReadonly}
        />
      </div>

      <SelectWithClassName
        id="injury-contraindications"
        selectorIconColor="text-text"
        label="Injury Contraindications"
        selectionMode="multiple"
        selectedKeys={
          formData?.injuryContraindications
            ? new Set(
              formData.injuryContraindications.filter(
                (key: string) => key && key.trim() && injuryContraindications.includes(key),
              ),
            )
            : new Set()
        }
        onSelectionChange={(keys) => {
          setFormData((prev: any) => ({
            ...prev,
            injuryContraindications: Array.from(keys).filter(
              (key: string) => key && key.trim(),
            ) as string[],
          }));
        }}
        isDisabled={isReadonly}
        classNames={{
          base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
          trigger: `bg-surface data-[open=true]:border-border ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
          value: `group-data-[has-value=true]:text-text ${isReadonly ? 'opacity-100' : ''}`,
          label: isReadonly ? 'opacity-100' : '',
        }}
        children={
          <>
            {injuryContraindications.map((injury) => (
              <SelectItem
                key={injury}
                textValue={injury
                  .replaceAll('_', ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              >
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-text">
                    {injury
                      .replaceAll('_', ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                </div>
              </SelectItem>
            ))}
          </>
        }
      />

      {!isReadonly && (
        <div className="flex gap-2 items-center">
          <Input
            classNames={{
              inputWrapper: 'bg-surface group-data-[focus=true]:border-border',
              input: 'text-text',
            }}
            size="sm"
            variant="bordered"
            label="Specify Other Injury Contraindication"
            placeholder="e.g., ACL tear or other"
            value={customInjury}
            onChange={(e) => setCustomInjury(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const trimmedInput = customInjury.trim();
                if (!trimmedInput) return;

                const inputValue = normalizeInjury(trimmedInput);
                if (
                  inputValue &&
                  inputValue !== '_' &&
                  !formData?.injuryContraindications?.includes(inputValue)
                ) {
                  setFormData((prev: any) => ({
                    ...prev,
                    injuryContraindications: [
                      ...(prev.injuryContraindications || []).filter(
                        (item: string) => item && item.trim(),
                      ),
                      inputValue,
                    ],
                  }));
                  // Add to options list if not already present
                  if (!injuryContraindications.includes(inputValue)) {
                    setInjuryContraindications([
                      ...injuryContraindications.filter((item) => item && item.trim()),
                      inputValue,
                    ]);
                  }
                  setCustomInjury('');
                }
              }
            }}
            className="flex-1"
          />
          <Button
            className="bg-primary text-surface"
            onPress={() => {
              const trimmedInput = customInjury.trim();
              if (!trimmedInput) return;

              const inputValue = normalizeInjury(trimmedInput);
              if (
                inputValue &&
                inputValue !== '_' &&
                !formData?.injuryContraindications?.includes(inputValue)
              ) {
                setFormData((prev: any) => ({
                  ...prev,
                  injuryContraindications: [
                    ...(prev.injuryContraindications || []).filter(
                      (item: string) => item && item.trim(),
                    ),
                    inputValue,
                  ],
                }));
                // Add to options list if not already present
                if (!injuryContraindications.includes(inputValue)) {
                  setInjuryContraindications([
                    ...injuryContraindications.filter((item) => item && item.trim()),
                    inputValue,
                  ]);
                }
                setCustomInjury('');
              }
            }}
            isDisabled={
              !customInjury.trim() ||
              formData?.injuryContraindications?.includes(normalizeInjury(customInjury))
            }
          >
            Add
          </Button>
        </div>
      )}

      {!isReadonly && equipmentsData.length > 0 && (
        <SelectWithClassName
          fullWidth
          id="equipment"
          label="Equipment"
          selectedKeys={formData?.needEquipment ? [formData.needEquipment] : []}
          onSelectionChange={(keys) => {
            setFormData((prev: any) => ({
              ...prev,
              needEquipment: Array.from(keys),
            }));
          }}
          isDisabled={isReadonly}
          classNames={{
            base: `${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
            trigger: `bg-surface data-[open=true]:border-border ${isReadonly ? 'opacity-100 cursor-not-allowed' : ''}`,
            value: `group-data-[has-value=true]:text-text ${isReadonly ? 'opacity-100' : ''}`,
            label: isReadonly ? 'opacity-100' : '',
          }}
          children={
            <>
              {equipmentsData?.map((equipment) => (
                <SelectItem key={equipment.id}>{equipment.name}</SelectItem>
              ))}
            </>
          }
        />
      )}

      {!isReadonly && (
        <div className="flex justify-end mb-4">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="bg-primary text-surface"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Exercise' : 'Save Exercise'}
          </Button>
        </div>
      )}
    </form>
  );
};
