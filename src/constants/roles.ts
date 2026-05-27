export const ROLES = {
  STUDENT: "student",
  COACH: "coach",
  COLLABORATOR: "collaborator",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const COACH_ROLES: UserRole[] = [ROLES.COACH, ROLES.COLLABORATOR, ROLES.ADMIN];
