import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Checkbox,
  Textarea,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  addToast,
} from '@heroui/react';
import { FaPlus } from 'react-icons/fa';
import { format } from 'date-fns';
import { parseDate } from '@internationalized/date';

// Icon components
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

const Trash2 = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const Edit = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

interface PhysicalLimitationsProps {
  userId: string;
  onSave?: (limitations: any) => void;
}

interface PhysicalLimitation {
  id: string;
  type: 'TEMPORARY' | 'PERMANENT' | 'CHRONIC';
  category: 'MOBILITY' | 'STRENGTH' | 'ENDURANCE' | 'COORDINATION' | 'BALANCE' | 'SENSORY';
  description: string;
  affectedBodyParts: string[];
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  startDate: Date;
  endDate?: Date;
  exerciseRestrictions: ExerciseRestriction[];
  accommodationRequirements: AccommodationRequirement[];
  progressTracking: LimitationProgressTracking[];
  lastUpdated: Date;
}

interface ExerciseRestriction {
  exerciseType: string;
  restrictionType:
    | 'COMPLETE_RESTRICTION'
    | 'PARTIAL_RESTRICTION'
    | 'MODIFICATION_REQUIRED'
    | 'SUPERVISION_REQUIRED';
  specificExercises?: string[];
  alternatives: string[];
  modifications: ExerciseModification[];
  reason: string;
}

interface ExerciseModification {
  exerciseId: string;
  modificationType:
    | 'RANGE_OF_MOTION'
    | 'LOAD_REDUCTION'
    | 'SPEED_MODIFICATION'
    | 'EQUIPMENT_SUBSTITUTION'
    | 'POSITION_CHANGE'
    | 'ASSISTANCE_REQUIRED';
  description: string;
  alternatives?: string[];
}

interface AccommodationRequirement {
  type: 'EQUIPMENT' | 'ENVIRONMENT' | 'ASSISTANCE' | 'COMMUNICATION' | 'TIME' | 'INSTRUCTION';
  description: string;
  equipment?: string[];
  modifications?: string[];
}

interface LimitationProgressTracking {
  date: Date;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  functionalCapacity: number;
  painLevel?: number;
  notes?: string;
  assessedBy?: string;
}

export const PhysicalLimitations: React.FC<PhysicalLimitationsProps> = ({ userId, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [limitations, setLimitations] = useState<PhysicalLimitation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newLimitation, setNewLimitation] = useState<Partial<PhysicalLimitation>>({
    type: 'TEMPORARY',
    category: 'MOBILITY',
    severity: 'MILD',
    affectedBodyParts: [],
    exerciseRestrictions: [],
    accommodationRequirements: [],
    progressTracking: [],
  });

  useEffect(() => {
    loadLimitations();
  }, [userId]);

  const loadLimitations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/physical-limitations`);
      if (response.ok) {
        const data = await response.json();
        setLimitations(data);
      }
    } catch (error) {
      console.error('Failed to load physical limitations:', error);
      addToast({
        title: 'Failed to load',
        description: 'Error loading physical limitations.',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveLimitations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/physical-limitations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(limitations),
      });

      if (response.ok) {
        addToast({
          title: 'Saved',
          description: 'Physical limitations saved successfully.',
          color: 'success',
        });
        onSave?.(limitations);
      } else {
        throw new Error('Failed to save limitations');
      }
    } catch (error) {
      console.error('Failed to save physical limitations:', error);
      addToast({
        title: 'Save failed',
        description: 'Error saving physical limitations.',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const addLimitation = () => {
    if (newLimitation.description && newLimitation.category) {
      const limitation: PhysicalLimitation = {
        id: Date.now().toString(),
        type: newLimitation.type || 'TEMPORARY',
        category: newLimitation.category || 'MOBILITY',
        description: newLimitation.description,
        affectedBodyParts: newLimitation.affectedBodyParts || [],
        severity: newLimitation.severity || 'MILD',
        startDate: newLimitation.startDate || new Date(),
        endDate: newLimitation.endDate,
        exerciseRestrictions: newLimitation.exerciseRestrictions || [],
        accommodationRequirements: newLimitation.accommodationRequirements || [],
        progressTracking: newLimitation.progressTracking || [],
        lastUpdated: new Date(),
      };

      if (editingIndex !== null) {
        const updatedLimitations = [...limitations];
        updatedLimitations[editingIndex] = limitation;
        setLimitations(updatedLimitations);
        setEditingIndex(null);
      } else {
        setLimitations([...limitations, limitation]);
      }

      setNewLimitation({
        type: 'TEMPORARY',
        category: 'MOBILITY',
        severity: 'MILD',
        affectedBodyParts: [],
        exerciseRestrictions: [],
        accommodationRequirements: [],
        progressTracking: [],
      });
      setShowAddForm(false);
    }
  };

  const editLimitation = (index: number) => {
    setNewLimitation(limitations[index]);
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const removeLimitation = (index: number) => {
    setLimitations(limitations.filter((_, i) => i !== index));
  };

  const addExerciseRestriction = () => {
    const restriction: ExerciseRestriction = {
      exerciseType: '',
      restrictionType: 'PARTIAL_RESTRICTION',
      alternatives: [],
      modifications: [],
      reason: '',
    };

    setNewLimitation((prev) => ({
      ...prev,
      exerciseRestrictions: [...(prev.exerciseRestrictions || []), restriction],
    }));
  };

  const updateExerciseRestriction = (
    index: number,
    field: keyof ExerciseRestriction,
    value: any,
  ) => {
    setNewLimitation((prev) => ({
      ...prev,
      exerciseRestrictions: prev.exerciseRestrictions?.map((restriction, i) =>
        i === index ? { ...restriction, [field]: value } : restriction,
      ),
    }));
  };

  const removeExerciseRestriction = (index: number) => {
    setNewLimitation((prev) => ({
      ...prev,
      exerciseRestrictions: prev.exerciseRestrictions?.filter((_, i) => i !== index),
    }));
  };

  const addAccommodationRequirement = () => {
    const requirement: AccommodationRequirement = {
      type: 'EQUIPMENT',
      description: '',
      equipment: [],
      modifications: [],
    };

    setNewLimitation((prev) => ({
      ...prev,
      accommodationRequirements: [...(prev.accommodationRequirements || []), requirement],
    }));
  };

  const updateAccommodationRequirement = (
    index: number,
    field: keyof AccommodationRequirement,
    value: any,
  ) => {
    setNewLimitation((prev) => ({
      ...prev,
      accommodationRequirements: prev.accommodationRequirements?.map((requirement, i) =>
        i === index ? { ...requirement, [field]: value } : requirement,
      ),
    }));
  };

  const removeAccommodationRequirement = (index: number) => {
    setNewLimitation((prev) => ({
      ...prev,
      accommodationRequirements: prev.accommodationRequirements?.filter((_, i) => i !== index),
    }));
  };

  const severityColors = {
    MILD: 'bg-green-100 success',
    MODERATE: 'bg-warning/10 text-warningHover',
    SEVERE: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  const typeColors = {
    TEMPORARY: 'bg-info/10 text-blue-800',
    PERMANENT: 'bg-gray-100 text-gray-800',
    CHRONIC: 'bg-purple-100 text-purple-800',
  };

  const bodyParts = [
    'HEAD',
    'NECK',
    'SHOULDERS',
    'ARMS',
    'ELBOWS',
    'WRISTS',
    'HANDS',
    'CHEST',
    'BACK',
    'CORE',
    'HIPS',
    'THIGHS',
    'KNEES',
    'CALVES',
    'ANKLES',
    'FEET',
  ];

  // Helper objects for displaying readable text instead of translation
  const typeLabels: Record<string, string> = {
    TEMPORARY: 'Temporary',
    PERMANENT: 'Permanent',
    CHRONIC: 'Chronic',
  };
  const categoryLabels: Record<string, string> = {
    MOBILITY: 'Mobility',
    STRENGTH: 'Strength',
    ENDURANCE: 'Endurance',
    COORDINATION: 'Coordination',
    BALANCE: 'Balance',
    SENSORY: 'Sensory',
  };
  const severityLabels: Record<string, string> = {
    MILD: 'Mild',
    MODERATE: 'Moderate',
    SEVERE: 'Severe',
    CRITICAL: 'Critical',
  };
  const restrictionTypeLabels: Record<string, string> = {
    COMPLETE_RESTRICTION: 'Complete Restriction',
    PARTIAL_RESTRICTION: 'Partial Restriction',
    MODIFICATION_REQUIRED: 'Modification Required',
    SUPERVISION_REQUIRED: 'Supervision Required',
  };
  const accommodationLabels: Record<string, string> = {
    EQUIPMENT: 'Equipment',
    ENVIRONMENT: 'Environment',
    ASSISTANCE: 'Assistance',
    COMMUNICATION: 'Communication',
    TIME: 'Time',
    INSTRUCTION: 'Instruction',
  };
  const bodyPartsLabels: Record<string, string> = {
    HEAD: 'Head',
    NECK: 'Neck',
    SHOULDERS: 'Shoulders',
    ARMS: 'Arms',
    ELBOWS: 'Elbows',
    WRISTS: 'Wrists',
    HANDS: 'Hands',
    CHEST: 'Chest',
    BACK: 'Back',
    CORE: 'Core',
    HIPS: 'Hips',
    THIGHS: 'Thighs',
    KNEES: 'Knees',
    CALVES: 'Calves',
    ANKLES: 'Ankles',
    FEET: 'Feet',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h4>Physical Limitations</h4>
            <Button variant="shadow" onPress={() => setShowAddForm(true)}>
              <FaPlus />
              Add Limitation
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="p-4 border-2 border-dashed">
              <h4 className="font-medium mb-4">
                {editingIndex !== null ? 'Edit Physical Limitation' : 'Add Physical Limitation'}
              </h4>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5>Type</h5>
                    <Select
                      selectedKeys={newLimitation.type}
                      onSelectionChange={(value) =>
                        setNewLimitation((prev) => ({ ...prev, type: value.currentKey as any }))
                      }
                    >
                      <SelectItem key="TEMPORARY">Temporary</SelectItem>
                      <SelectItem key="PERMANENT">Permanent</SelectItem>
                      <SelectItem key="CHRONIC">Chronic</SelectItem>
                    </Select>
                  </div>

                  <div>
                    <div className="text-lg font-medium">Category</div>
                    <Select
                      selectedKeys={newLimitation.category}
                      onSelectionChange={(value) =>
                        setNewLimitation((prev) => ({ ...prev, category: value as any }))
                      }
                    >
                      <SelectItem key="MOBILITY">Mobility</SelectItem>
                      <SelectItem key="STRENGTH">Strength</SelectItem>
                      <SelectItem key="ENDURANCE">Endurance</SelectItem>
                      <SelectItem key="COORDINATION">Coordination</SelectItem>
                      <SelectItem key="BALANCE">Balance</SelectItem>
                      <SelectItem key="SENSORY">Sensory</SelectItem>
                    </Select>
                  </div>

                  <div>
                    <div className="text-lg font-medium">Severity</div>
                    <Select
                      selectedKeys={newLimitation.severity}
                      onSelectionChange={(value) =>
                        setNewLimitation((prev) => ({ ...prev, severity: value.currentKey as any }))
                      }
                    >
                      <SelectItem key="MILD">Mild</SelectItem>
                      <SelectItem key="MODERATE">Moderate</SelectItem>
                      <SelectItem key="SEVERE">Severe</SelectItem>
                      <SelectItem key="CRITICAL">Critical</SelectItem>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="text-lg font-medium">Description</div>
                  <Textarea
                    value={newLimitation.description || ''}
                    onValueChange={(e) => setNewLimitation((prev) => ({ ...prev, description: e }))}
                    placeholder="Describe the limitation..."
                  />
                </div>

                {/* Affected Body Parts */}
                <div>
                  <div className="text-lg font-medium">Affected Body Parts</div>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-2">
                    {bodyParts.map((part) => (
                      <div key={part} className="flex items-center space-x-1">
                        <Checkbox
                          id={`body-${part}`}
                          checked={newLimitation.affectedBodyParts?.includes(part)}
                          onValueChange={(checked) => {
                            const currentParts = newLimitation.affectedBodyParts || [];
                            if (checked) {
                              setNewLimitation((prev) => ({
                                ...prev,
                                affectedBodyParts: [...currentParts, part],
                              }));
                            } else {
                              setNewLimitation((prev) => ({
                                ...prev,
                                affectedBodyParts: currentParts.filter((p) => p !== part),
                              }));
                            }
                          }}
                        />
                        <div className="text-xs">{bodyPartsLabels[part]}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-lg font-medium">Start Date</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="bordered"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon />
                          {newLimitation.startDate
                            ? format(new Date(newLimitation.startDate), 'PPP')
                            : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          value={
                            newLimitation.startDate
                              ? parseDate(newLimitation.startDate.toString().split('T')[0])
                              : null
                          }
                          onChange={(dateValue) => {
                            if (!dateValue) return;
                            const jsDate = new Date((dateValue as any).toString());
                            setNewLimitation((prev) => ({
                              ...prev,
                              startDate: jsDate,
                            }));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {newLimitation.type === 'TEMPORARY' && (
                    <div>
                      <div className="text-lg font-medium">End Date</div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="bordered"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon />
                            {newLimitation.endDate
                              ? format(new Date(newLimitation.endDate), 'PPP')
                              : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            value={
                              newLimitation.endDate
                                ? parseDate(newLimitation.endDate.toString())
                                : null
                            }
                            onChange={(date) =>
                              setNewLimitation((prev) => ({
                                ...prev,
                                endDate: date ? new Date((date as any).toString()) : undefined,
                              }))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                {/* Exercise Restrictions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-medium">Exercise Restrictions</div>
                    <Button variant="shadow" size="sm" onPress={addExerciseRestriction}>
                      <FaPlus />
                      Add Restriction
                    </Button>
                  </div>

                  {newLimitation.exerciseRestrictions?.map((restriction, index) => (
                    <Card key={index} className="p-3 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Restriction {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => removeExerciseRestriction(index)}
                        >
                          <Trash2 />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-lg font-medium">Exercise Type</div>
                          <Input
                            value={restriction.exerciseType}
                            onValueChange={(e) =>
                              updateExerciseRestriction(index, 'exerciseType', e)
                            }
                            placeholder="e.g. Deadlifts"
                          />
                        </div>

                        <div>
                          <div className="text-lg font-medium">Restriction Type</div>
                          <Select
                            selectedKeys={restriction.restrictionType}
                            onSelectionChange={(value) =>
                              updateExerciseRestriction(
                                index,
                                'restrictionType',
                                value.currentKey as any,
                              )
                            }
                          >
                            <SelectItem key="COMPLETE_RESTRICTION">Complete Restriction</SelectItem>
                            <SelectItem key="PARTIAL_RESTRICTION">Partial Restriction</SelectItem>
                            <SelectItem key="MODIFICATION_REQUIRED">
                              Modification Required
                            </SelectItem>
                            <SelectItem key="SUPERVISION_REQUIRED">Supervision Required</SelectItem>
                          </Select>
                        </div>

                        <div className="md:col-span-2">
                          <div className="text-lg font-medium">Restriction Reason</div>
                          <Input
                            value={restriction.reason}
                            onValueChange={(e) => updateExerciseRestriction(index, 'reason', e)}
                            placeholder="Reason for restriction"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Accommodation Requirements */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-medium">Accommodation Requirements</div>
                    <Button variant="shadow" size="sm" onPress={addAccommodationRequirement}>
                      <FaPlus />
                      Add Accommodation
                    </Button>
                  </div>

                  {newLimitation.accommodationRequirements?.map((requirement, index) => (
                    <Card key={index} className="p-3 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Accommodation {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => removeAccommodationRequirement(index)}
                        >
                          <Trash2 />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-lg font-medium">Accommodation Type</div>
                          <Select
                            selectedKeys={requirement.type}
                            onSelectionChange={(value) =>
                              updateAccommodationRequirement(index, 'type', value.currentKey as any)
                            }
                          >
                            <SelectItem key="EQUIPMENT">Equipment</SelectItem>
                            <SelectItem key="ENVIRONMENT">Environment</SelectItem>
                            <SelectItem key="ASSISTANCE">Assistance</SelectItem>
                            <SelectItem key="COMMUNICATION">Communication</SelectItem>
                            <SelectItem key="TIME">Time</SelectItem>
                            <SelectItem key="INSTRUCTION">Instruction</SelectItem>
                          </Select>
                        </div>

                        <div>
                          <div className="text-lg font-medium">Description</div>
                          <Input
                            value={requirement.description}
                            onValueChange={(e) =>
                              updateAccommodationRequirement(index, 'description', e)
                            }
                            placeholder="Accommodation details"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="shadow"
                    onPress={() => {
                      setShowAddForm(false);
                      setEditingIndex(null);
                      setNewLimitation({
                        type: 'TEMPORARY',
                        category: 'MOBILITY',
                        severity: 'MILD',
                        affectedBodyParts: [],
                        exerciseRestrictions: [],
                        accommodationRequirements: [],
                        progressTracking: [],
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onPress={addLimitation}>
                    {editingIndex !== null ? 'Update' : 'Add'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Existing Limitations */}
          <div className="space-y-4">
            {limitations.map((limitation, index) => (
              <Card key={limitation.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge className={typeColors[limitation.type]}>
                      {typeLabels[limitation.type]}
                    </Badge>
                    <Badge className={severityColors[limitation.severity]}>
                      {severityLabels[limitation.severity]}
                    </Badge>
                    <span className="text-sm text-Secondary">
                      {categoryLabels[limitation.category]}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onPress={() => editLimitation(index)}>
                      <Edit />
                    </Button>
                    <Button variant="ghost" size="sm" onPress={() => removeLimitation(index)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                <p className="text-sm mb-3">{limitation.description}</p>

                {limitation.affectedBodyParts.length > 0 && (
                  <div className="mb-3">
                    <span className="text-sm font-medium">Affected Area(s):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {limitation.affectedBodyParts.map((part) => (
                        <Badge key={part} variant="shadow" className="text-xs">
                          {bodyPartsLabels[part]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Start Date: {format(new Date(limitation.startDate), 'PPP')}
                  {limitation.endDate && (
                    <> • End Date: {format(new Date(limitation.endDate), 'PPP')}</>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {limitations.length === 0 && !showAddForm && (
            <div className="text-center py-8 text-gray-500">
              <p>No physical limitations have been added.</p>
              <Button variant="shadow" className="mt-2" onPress={() => setShowAddForm(true)}>
                <FaPlus />
                Add your first Limitation
              </Button>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="shadow" onPress={loadLimitations} disabled={loading}>
              Reset
            </Button>
            <Button onPress={saveLimitations} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
