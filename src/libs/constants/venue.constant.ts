export const VENUE_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  DELETED: 'deleted',
} as const;

export type VenueStatus = (typeof VENUE_STATUS)[keyof typeof VENUE_STATUS];

export const VENUE_STATUS_VALUES = Object.values(VENUE_STATUS);
