export const TIME_SLOT_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  CANCELLED: 'cancelled',
  BLOCKED: 'blocked',
} as const;

export type TimeSlotStatus =
  (typeof TIME_SLOT_STATUS)[keyof typeof TIME_SLOT_STATUS];

export const TIME_SLOT_STATUS_VALUES = Object.values(TIME_SLOT_STATUS);

export const TIME_SLOT_WEEKDAY = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
} as const;

export type TimeSlotWeekday =
  (typeof TIME_SLOT_WEEKDAY)[keyof typeof TIME_SLOT_WEEKDAY];

export const TIME_SLOT_WEEKDAY_VALUES = Object.values(TIME_SLOT_WEEKDAY);
