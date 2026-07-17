export type UserRole = "super_admin" | "admin" | "manager" | "barmanager";

export const SUPER_ADMIN_EMAIL = "amanuelsahile2010@gmail.com";

export function normalizeRole(value?: unknown): UserRole {
  if (typeof value !== "string") {
    return "manager";
  }

  const normalized = value.toLowerCase();

  switch (normalized) {
    case "super_admin":
    case "superadmin":
      return "super_admin";
    case "admin":
      return "admin";
    case "manager":
      return "manager";
    case "barmanager":
    case "bar_manager":
      return "barmanager";
    default:
      return "manager";
  }
}

export function resolveEffectiveRole(
  email?: string | null,
  profileRole?: unknown,
): UserRole {
  if (email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return "super_admin";
  }

  return normalizeRole(profileRole);
}

export function serializeRoleForProfile(role: UserRole): string {
  return role === "barmanager" ? "bar_manager" : role;
}

export function canAccessManagerFeatures(role: UserRole) {
  return role === "super_admin" || role === "admin" || role === "manager";
}

export function canAccessAdminPanel(role: UserRole) {
  return role === "super_admin" || role === "admin";
}

export function canManageUsers(role: UserRole) {
  return role === "super_admin";
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    case "manager":
      return "Manager";
    case "barmanager":
      return "Bar Manager";
    default:
      return "Manager";
  }
}
