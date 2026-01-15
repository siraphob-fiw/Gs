import { Injectable } from '@nestjs/common';
import { Results, PaginationResult } from '@strengthos/shared-types';

@Injectable()
export class DataManipulationService {
  /**
   * Filter array by predicate with type safety
   */
  filter<T>(array: T[], predicate: (item: T, index: number) => boolean): T[] {
    return array.filter(predicate);
  }

  /**
   * Map array with type transformation
   */
  map<T, U>(array: T[], mapper: (item: T, index: number) => U): U[] {
    return array.map(mapper);
  }

  /**
   * Reduce array with type safety
   */
  reduce<T, U>(
    array: T[],
    reducer: (accumulator: U, current: T, index: number) => U,
    initialValue: U,
  ): U {
    return array.reduce(reducer, initialValue);
  }

  /**
   * Group array by key with type safety
   */
  groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const groupKey = String(item[key]);
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  /**
   * Group array by custom function
   */
  groupByFunction<T>(
    array: T[],
    keyFunction: (item: T) => string,
  ): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const groupKey = keyFunction(item);
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  /**
   * Sort array by key with type safety
   */
  sortBy<T, K extends keyof T>(
    array: T[],
    key: K,
    direction: 'asc' | 'desc' = 'asc',
  ): T[] {
    return [...array].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Sort array by custom function
   */
  sortByFunction<T>(array: T[], sortFunction: (a: T, b: T) => number): T[] {
    return [...array].sort(sortFunction);
  }

  /**
   * Find unique items in array
   */
  unique<T>(array: T[], keyFunction?: (item: T) => any): T[] {
    if (!keyFunction) {
      return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter((item) => {
      const key = keyFunction(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Find intersection of two arrays
   */
  intersection<T>(
    array1: T[],
    array2: T[],
    keyFunction?: (item: T) => any,
  ): T[] {
    if (!keyFunction) {
      const set2 = new Set(array2);
      return array1.filter((item) => set2.has(item));
    }

    const keys2 = new Set(array2.map(keyFunction));
    return array1.filter((item) => keys2.has(keyFunction(item)));
  }

  /**
   * Find difference between two arrays
   */
  difference<T>(array1: T[], array2: T[], keyFunction?: (item: T) => any): T[] {
    if (!keyFunction) {
      const set2 = new Set(array2);
      return array1.filter((item) => !set2.has(item));
    }

    const keys2 = new Set(array2.map(keyFunction));
    return array1.filter((item) => !keys2.has(keyFunction(item)));
  }

  /**
   * Paginate array data
   */
  paginate<T>(
    array: T[],
    page: number = 1,
    pageSize: number = 20,
  ): PaginationResult<T> {
    const total = array.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    const data = array.slice(offset, offset + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Chunk array into smaller arrays
   */
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Flatten nested arrays
   */
  flatten<T>(array: (T | T[])[]): T[] {
    return array.reduce<T[]>((flat, item) => {
      return flat.concat(Array.isArray(item) ? this.flatten(item) : item);
    }, []);
  }

  /**
   * Find item in array with type safety
   */
  find<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean,
  ): T | undefined {
    return array.find(predicate);
  }

  /**
   * Find index in array with type safety
   */
  findIndex<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean,
  ): number {
    return array.findIndex(predicate);
  }

  /**
   * Check if array includes item
   */
  includes<T>(array: T[], item: T, keyFunction?: (item: T) => any): boolean {
    if (!keyFunction) {
      return array.includes(item);
    }

    const targetKey = keyFunction(item);
    return array.some((arrayItem) => keyFunction(arrayItem) === targetKey);
  }

  /**
   * Sum numeric values in array
   */
  sum<T>(array: T[], valueFunction: (item: T) => number): number {
    return array.reduce((sum, item) => sum + valueFunction(item), 0);
  }

  /**
   * Calculate average of numeric values in array
   */
  average<T>(array: T[], valueFunction: (item: T) => number): number {
    if (array.length === 0) return 0;
    return this.sum(array, valueFunction) / array.length;
  }

  /**
   * Find minimum value in array
   */
  min<T>(array: T[], valueFunction: (item: T) => number): T | undefined {
    if (array.length === 0) return undefined;

    return array.reduce((min, item) =>
      valueFunction(item) < valueFunction(min) ? item : min,
    );
  }

  /**
   * Find maximum value in array
   */
  max<T>(array: T[], valueFunction: (item: T) => number): T | undefined {
    if (array.length === 0) return undefined;

    return array.reduce((max, item) =>
      valueFunction(item) > valueFunction(max) ? item : max,
    );
  }

  /**
   * Count items matching predicate
   */
  count<T>(array: T[], predicate: (item: T) => boolean): number {
    return array.filter(predicate).length;
  }

  /**
   * Check if all items match predicate
   */
  all<T>(array: T[], predicate: (item: T) => boolean): boolean {
    return array.every(predicate);
  }

  /**
   * Check if any item matches predicate
   */
  any<T>(array: T[], predicate: (item: T) => boolean): boolean {
    return array.some(predicate);
  }

  /**
   * Take first n items from array
   */
  take<T>(array: T[], count: number): T[] {
    return array.slice(0, count);
  }

  /**
   * Skip first n items from array
   */
  skip<T>(array: T[], count: number): T[] {
    return array.slice(count);
  }

  /**
   * Reverse array (creates new array)
   */
  reverse<T>(array: T[]): T[] {
    return [...array].reverse();
  }

  /**
   * Shuffle array randomly
   */
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Zip two arrays together
   */
  zip<T, U>(array1: T[], array2: U[]): [T, U][] {
    const length = Math.min(array1.length, array2.length);
    const result: [T, U][] = [];

    for (let i = 0; i < length; i++) {
      result.push([array1[i], array2[i]]);
    }

    return result;
  }

  /**
   * Create object from array using key and value functions
   */
  toObject<T, K extends string | number | symbol, V>(
    array: T[],
    keyFunction: (item: T) => K,
    valueFunction: (item: T) => V,
  ): Record<K, V> {
    return array.reduce(
      (obj, item) => {
        obj[keyFunction(item)] = valueFunction(item);
        return obj;
      },
      {} as Record<K, V>,
    );
  }

  /**
   * Safe array operation with error handling
   */
  safeOperation<T, U>(
    array: T[],
    operation: (array: T[]) => U,
    defaultValue: U,
  ): Results<U> {
    try {
      const result = operation(array);
      return Results.ok(result);
    } catch (error) {
      return Results.fail(
        defaultValue,
        `Array operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Batch process array in chunks
   */
  async batchProcess<T, U>(
    array: T[],
    processor: (batch: T[]) => Promise<U[]>,
    batchSize: number = 100,
  ): Promise<Results<U[]>> {
    try {
      const chunks = this.chunk(array, batchSize);
      const results: U[] = [];

      for (const chunk of chunks) {
        const chunkResults = await processor(chunk);
        results.push(...chunkResults);
      }

      return Results.ok(results);
    } catch (error) {
      return Results.fail<U[]>(
        [],
        `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
