import { Modifier, ModifierCategory } from '@/hooks/api/use-modifier';

export const MODIFIER_CATEGORY_NAMES = {
  BAR_TYPE: 'bar type',
  TEMPO: 'tempo',
  RANGE_OF_MOTION: 'range of motion',
  STANCE_GRIP: 'stance / grip',
  KIT: 'kit',
  OTHER: 'other',
  LOAD_ACCOMMODATION: 'load accommodation',
} as const;

export const MULTI_SELECT_CATEGORIES = [
  MODIFIER_CATEGORY_NAMES.LOAD_ACCOMMODATION,
  MODIFIER_CATEGORY_NAMES.KIT,
  MODIFIER_CATEGORY_NAMES.OTHER,
] as const;

export function isMultiSelectCategory(categoryName: string): boolean {
  const normalizedName = categoryName.toLowerCase().trim();
  return MULTI_SELECT_CATEGORIES.some((cat) => normalizedName === cat);
}

export function getCategoryName(
  categoryId: string,
  categories: ModifierCategory[],
): string | undefined {
  const category = categories.find((cat) => cat.id === categoryId);
  return category?.name?.toLowerCase().trim();
}

const PREFIX_PRIORITY: Record<string, number> = {
  [MODIFIER_CATEGORY_NAMES.BAR_TYPE]: 1,
  [MODIFIER_CATEGORY_NAMES.TEMPO]: 2,
  [MODIFIER_CATEGORY_NAMES.RANGE_OF_MOTION]: 3,
  [MODIFIER_CATEGORY_NAMES.STANCE_GRIP]: 4,
};

const SUFFIX_PRIORITY: Record<string, number> = {
  [MODIFIER_CATEGORY_NAMES.KIT]: 1,
  [MODIFIER_CATEGORY_NAMES.LOAD_ACCOMMODATION]: 2,
};

interface ModifierWithCategory {
  modifier: Modifier;
  categoryName: string;
}

export function generateModifiedExerciseName(
  baseExerciseName: string,
  modifierIds: string[],
  modifiers: Modifier[],
  categories: ModifierCategory[],
): string {
  if (!modifierIds || modifierIds.length === 0 || !modifiers || !categories) {
    return baseExerciseName;
  }

  const modifiersWithCategories: ModifierWithCategory[] = modifierIds
    .map((modifierId) => {
      const modifier = modifiers.find((m) => m.id === modifierId);
      if (!modifier) return null;

      const categoryName = getCategoryName(modifier.modifier_category_id, categories);
      if (!categoryName) return null;

      return { modifier, categoryName };
    })
    .filter((item): item is ModifierWithCategory => item !== null);

  const prefixModifiers: ModifierWithCategory[] = [];
  const kitModifiers: ModifierWithCategory[] = [];
  const loadAccommodationModifiers: ModifierWithCategory[] = [];
  const otherModifiers: ModifierWithCategory[] = [];

  for (const item of modifiersWithCategories) {
    if (PREFIX_PRIORITY[item.categoryName] !== undefined) {
      prefixModifiers.push(item);
    } else if (item.categoryName === MODIFIER_CATEGORY_NAMES.KIT) {
      kitModifiers.push(item);
    } else if (item.categoryName === MODIFIER_CATEGORY_NAMES.LOAD_ACCOMMODATION) {
      loadAccommodationModifiers.push(item);
    } else {
      otherModifiers.push(item);
    }
  }

  prefixModifiers.sort(
    (a, b) => (PREFIX_PRIORITY[a.categoryName] ?? 99) - (PREFIX_PRIORITY[b.categoryName] ?? 99),
  );

  const nameParts: string[] = [];

  for (const item of prefixModifiers) {
    nameParts.push(item.modifier.name);
  }

  nameParts.push(baseExerciseName);

  let finalName = nameParts.join(' ');

  const kitNames = kitModifiers.map((item) => item.modifier.name).join(' and ');
  const loadAccommodationNames = loadAccommodationModifiers
    .map((item) => item.modifier.name)
    .join(' and ');
  const otherNames = otherModifiers.map((item) => item.modifier.name).join(' and ');

  const suffixParts: string[] = [];

  if (kitNames) {
    suffixParts.push(kitNames);
  }
  if (loadAccommodationNames) {
    suffixParts.push(loadAccommodationNames);
  }
  if (otherNames) {
    suffixParts.push(otherNames);
  }

  if (suffixParts.length > 0) {
    const suffix = suffixParts.join(' and ');
    finalName = `${finalName} with ${suffix}`;
  }

  return finalName;
}

export function useModifiedExerciseName(
  baseExerciseName: string,
  modifierIds: string[],
  modifiersData: { modifiers: Modifier[] } | undefined,
  categoriesData: { modifier_categories: ModifierCategory[] } | undefined,
): string {
  if (!modifiersData?.modifiers || !categoriesData?.modifier_categories) {
    return baseExerciseName;
  }

  return generateModifiedExerciseName(
    baseExerciseName,
    modifierIds,
    modifiersData.modifiers,
    categoriesData.modifier_categories,
  );
}
