import { PermissionType } from './user.schema';

const LEGACY_PURCHASING_KEY = 'products:purchasing';

const ALL_PERMISSIONS: PermissionType[] = [
  'dashboard:access',
  'billing:access',
  'expenses:view',
  'products:view',
  'products:add',
  'products:edit',
  'products:purchase_products',
  'products:purchase_pricing',
  'orders:view',
  'reports:view',
  'users:view',
  'users:add',
];

export function sanitizePermissions(
  permissions: string[] = [],
): PermissionType[] {
  return permissions.filter(
    (permission): permission is PermissionType =>
      ALL_PERMISSIONS.includes(permission as PermissionType) &&
      permission !== LEGACY_PURCHASING_KEY,
  );
}

export function expandPermissionsForAccessCheck(
  permissions: string[] = [],
): string[] {
  const expanded = new Set(permissions);

  if (expanded.has(LEGACY_PURCHASING_KEY)) {
    expanded.delete(LEGACY_PURCHASING_KEY);
    expanded.add('products:purchase_products');
    expanded.add('products:purchase_pricing');
  }

  return Array.from(expanded);
}

export function hasPermissionInList(
  userPermissions: string[] | undefined,
  required: string,
): boolean {
  if (!userPermissions?.length) return false;
  return expandPermissionsForAccessCheck(userPermissions).includes(required);
}
