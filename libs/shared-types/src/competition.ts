// Competition types for StrengthOS platform

export interface Competition {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: CompetitionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum CompetitionStatus {
  PLANNING = 'PLANNING',
  PREP = 'PREP',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}