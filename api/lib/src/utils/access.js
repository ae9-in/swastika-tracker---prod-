import { ROLES } from '../constants/domain.js';
import { forbidden } from '../utils/errors.js';

export function ensureBusinessAccess(auth, targetBusinessId) {
  if (auth.role === ROLES.SUPER_ADMIN) {
    return;
  }

  if (!auth.allowedBusinessIds?.includes(targetBusinessId)) {
    throw forbidden('You do not have access to this business');
  }
}

export function scopedBusinessId(auth) {
  return auth.activeBusinessId || null;
}
