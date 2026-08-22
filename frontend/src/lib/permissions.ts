export const SUPER_ADMIN_ROLE = "super_admin";

export const PERMISSION_GROUPS = [
  {
    id: "core",
    label: "Core Operations",
    permissions: [
      {
        key: "dashboard:access",
        label: "Overview",
        description: "View the admin overview dashboard",
      },
      {
        key: "billing:access",
        label: "Point of Sale",
        description: "Create sales, apply discounts, and print receipts",
      },
      {
        key: "expenses:view",
        label: "Daily Expenses",
        description: "Record and view daily operating expenses",
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    permissions: [
      {
        key: "products:view",
        label: "View Products",
        description: "Browse product catalog and stock levels",
      },
      {
        key: "products:add",
        label: "Add Products",
        description: "Create new products in the catalog",
      },
      {
        key: "products:edit",
        label: "Edit Products",
        description: "Update product details and stock",
      },
      {
        key: "products:purchase_products",
        label: "Purchase Products",
        description: "Record stock purchases from suppliers",
      },
      {
        key: "products:purchase_pricing",
        label: "Purchase Pricing",
        description: "Manage purchase costs and selling prices",
      },
    ],
  },
  {
    id: "transactions",
    label: "Transactions",
    permissions: [
      {
        key: "orders:view",
        label: "View Orders",
        description: "View order history and invoice details",
      },
    ],
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    permissions: [
      {
        key: "reports:view",
        label: "Reports",
        description: "Access daily sales, P&L, stock, and other reports",
      },
    ],
  },
  {
    id: "access",
    label: "Access Control",
    permissions: [
      {
        key: "users:view",
        label: "View Users",
        description: "View user accounts and permissions",
      },
      {
        key: "users:add",
        label: "Manage Users",
        description: "Create users and update their access",
      },
    ],
  },
] as const;

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.key)
);

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

export type PermissionDefinition =
  (typeof PERMISSION_GROUPS)[number]["permissions"][number];

const LEGACY_PURCHASING_KEY = "products:purchasing";

export function isLegacyPurchasingPermission(permission: string): boolean {
  return permission === LEGACY_PURCHASING_KEY;
}

export function normalizePermissionsForEdit(
  permissions: string[] = []
): PermissionKey[] {
  const result = new Set<PermissionKey>();

  permissions.forEach((permission) => {
    if (permission === LEGACY_PURCHASING_KEY) {
      result.add("products:purchase_products");
      result.add("products:purchase_pricing");
      return;
    }

    if (ALL_PERMISSIONS.includes(permission as PermissionKey)) {
      result.add(permission as PermissionKey);
    }
  });

  return Array.from(result);
}

export function sanitizePermissionsForSave(
  permissions: string[] = []
): PermissionKey[] {
  return permissions.filter(
    (permission): permission is PermissionKey =>
      ALL_PERMISSIONS.includes(permission as PermissionKey) &&
      permission !== LEGACY_PURCHASING_KEY
  );
}

export function expandPermissionsForAccessCheck(
  permissions: string[] = []
): string[] {
  const expanded = new Set(permissions);

  if (expanded.has(LEGACY_PURCHASING_KEY)) {
    expanded.delete(LEGACY_PURCHASING_KEY);
    expanded.add("products:purchase_products");
    expanded.add("products:purchase_pricing");
  }

  return Array.from(expanded);
}

export function isSuperAdmin(role?: string): boolean {
  return role === SUPER_ADMIN_ROLE;
}

export function createEmptyPermissionState(): Record<PermissionKey, boolean> {
  return Object.fromEntries(
    ALL_PERMISSIONS.map((key) => [key, false])
  ) as Record<PermissionKey, boolean>;
}

export function permissionsFromState(
  state: Record<PermissionKey, boolean>
): PermissionKey[] {
  return ALL_PERMISSIONS.filter((key) => state[key]);
}

export function stateFromPermissions(
  permissions: string[] = []
): Record<PermissionKey, boolean> {
  const state = createEmptyPermissionState();
  normalizePermissionsForEdit(permissions).forEach((permission) => {
    state[permission] = true;
  });
  return state;
}

export function formatPermissionLabel(key: string): string {
  for (const group of PERMISSION_GROUPS) {
    for (const permission of group.permissions) {
      if (permission.key === key) return permission.label;
    }
  }
  return key;
}

export function formatPermissionDescription(key: string): string {
  for (const group of PERMISSION_GROUPS) {
    for (const permission of group.permissions) {
      if (permission.key === key) return permission.description;
    }
  }
  return "";
}

export function hasPermissionInList(
  userPermissions: string[] | undefined,
  required: string
): boolean {
  if (!userPermissions?.length) return false;

  const effectivePermissions = expandPermissionsForAccessCheck(userPermissions);
  return effectivePermissions.includes(required);
}

export function hasEffectivePermission(
  user:
    | {
        role?: string;
        permissions?: string[];
      }
    | null
    | undefined,
  required: string | string[]
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user.role)) return true;

  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.some((permission) =>
    hasPermissionInList(user.permissions, permission)
  );
}

export function hasAnyPermission(
  userPermissions: string[] | undefined,
  required: string | string[],
  role?: string
): boolean {
  return hasEffectivePermission({ role, permissions: userPermissions }, required);
}

export function getAssignablePermissions(actorRole?: string): PermissionKey[] {
  if (actorRole === SUPER_ADMIN_ROLE || actorRole === "admin") {
    return [...ALL_PERMISSIONS];
  }
  return [];
}

export function getAssignablePermissionGroups(actorRole?: string) {
  const assignable = new Set(getAssignablePermissions(actorRole));
  return PERMISSION_GROUPS.map((group) => ({
    ...group,
    permissions: group.permissions.filter((permission) =>
      assignable.has(permission.key)
    ),
  })).filter((group) => group.permissions.length > 0);
}
