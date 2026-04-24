export const COURT_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  DELETED: 'deleted',
} as const;

export type CourtStatus = (typeof COURT_STATUS)[keyof typeof COURT_STATUS];

export const COURT_STATUS_VALUES = Object.values(COURT_STATUS);
