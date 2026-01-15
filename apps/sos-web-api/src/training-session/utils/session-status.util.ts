/**
 * Utility for calculating session status based on exercise statuses
 */
export class SessionStatusUtil {
  /**
   * Determine session status based on exercise statuses
   */
  static calculateSessionStatus(
    exerciseStatuses: Array<string | null>,
  ): string {
    if (exerciseStatuses.length === 0) {
      return 'PLANNED';
    }

    if (exerciseStatuses.every((status) => status === 'PLANNED')) {
      return 'PLANNED';
    }

    if (exerciseStatuses.every((status) => status === 'COMPLETED')) {
      return 'COMPLETED';
    }

    if (exerciseStatuses.some((status) => status === 'OVERDUE')) {
      return 'OVERDUE';
    }

    if (
      exerciseStatuses.some((status) => status === 'IN_PROGRESS') ||
      (exerciseStatuses.some((status) => status === 'COMPLETED') &&
        exerciseStatuses.some((status) => status === 'IN_PROGRESS'))
    ) {
      return 'IN_PROGRESS';
    }

    return 'PLANNED';
  }
}
