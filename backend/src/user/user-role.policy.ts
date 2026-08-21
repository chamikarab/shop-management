import { UserRole } from './user.schema';

export function canCreateUsers(actorRole: UserRole): boolean {
  return actorRole === 'super_admin' || actorRole === 'admin';
}

export function canAssignRole(
  actorRole: UserRole,
  targetRole: UserRole,
): boolean {
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin') {
    return targetRole === 'manager' || targetRole === 'cashier';
  }
  return false;
}

export function canDeleteUser(
  actorRole: UserRole,
  targetRole: UserRole,
  actorId: string,
  targetId: string,
): boolean {
  if (actorId === targetId) return false;
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin') {
    return targetRole === 'manager' || targetRole === 'cashier';
  }
  return false;
}

export function canUpdateUser(
  actorRole: UserRole,
  targetRole: UserRole,
): boolean {
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin') {
    return targetRole === 'manager' || targetRole === 'cashier';
  }
  return false;
}
