export const USER_ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
] as const;

export type UserRole = (typeof USER_ROLES)[number]["value"];

export function formatRoleLabel(role?: string): string {
  if (!role) return "Super Admin";
  const match = USER_ROLES.find((r) => r.value === role);
  if (match) return match.label;
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getRoleColor(role: string): string {
  switch (role.toLowerCase()) {
    case "super_admin":
      return "bg-rose-50 text-rose-600 border-rose-100";
    case "admin":
      return "bg-purple-50 text-purple-600 border-purple-100";
    case "manager":
      return "bg-indigo-50 text-indigo-600 border-indigo-100";
    case "cashier":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

export function getRoleGradient(role: string): string {
  switch (role.toLowerCase()) {
    case "super_admin":
      return "from-rose-500/20 via-orange-500/10 to-transparent";
    case "admin":
      return "from-purple-500/20 via-indigo-500/10 to-transparent";
    case "manager":
      return "from-indigo-500/20 via-blue-500/10 to-transparent";
    case "cashier":
      return "from-emerald-500/20 via-teal-500/10 to-transparent";
    default:
      return "from-slate-500/10 via-slate-400/5 to-transparent";
  }
}

export function canCreateUsers(role?: string): boolean {
  return role === "super_admin" || role === "admin";
}

export function canAssignRole(actorRole?: string, targetRole?: string): boolean {
  if (!actorRole || !targetRole) return false;
  if (actorRole === "super_admin") return true;
  if (actorRole === "admin") {
    return targetRole === "manager" || targetRole === "cashier";
  }
  return false;
}

export function canDeleteUser(actorRole?: string, targetRole?: string): boolean {
  if (!actorRole || !targetRole) return false;
  if (actorRole === "super_admin") return true;
  if (actorRole === "admin") {
    return targetRole === "manager" || targetRole === "cashier";
  }
  return false;
}

export function canManageUser(actorRole?: string, targetRole?: string): boolean {
  return canDeleteUser(actorRole, targetRole);
}

export function getCreatableRoles(actorRole?: string) {
  return USER_ROLES.filter((role) => canAssignRole(actorRole, role.value));
}
