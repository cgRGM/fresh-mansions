import type { UserRole } from "./validators";

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const parseSuperUserEmails = (
  value: string | undefined
): Set<string> => {
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .split(",")
      .map((entry) => normalizeEmail(entry))
      .filter(Boolean)
  );
};

export const isSuperUserEmail = (
  email: string,
  configuredEmails: string | undefined
): boolean => parseSuperUserEmails(configuredEmails).has(normalizeEmail(email));

export const hasRoleAccess = (
  currentRole: UserRole,
  allowedRoles: UserRole[]
): boolean =>
  currentRole === "super_user" || allowedRoles.includes(currentRole);
