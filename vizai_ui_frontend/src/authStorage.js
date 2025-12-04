//
// PUBLIC_INTERFACE
// Simple localStorage-backed auth persistence layer for email + role.
// Role is only shown at registration, but persisted for internal guards/navigation.
//
const KEY = 'vizai_auth_user_v1';

/**
 * PUBLIC_INTERFACE
 * Save the authenticated user to localStorage.
 * This stores minimal shape: { email, role }
 */
export function saveUser(user) {
  /** Role is required at registration; at login we keep existing role if present. */
  try {
    const data = { email: user?.email || '', role: user?.role || '' };
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors in constrained environments
  }
}

/**
 * PUBLIC_INTERFACE
 * Load the authenticated user from localStorage, if present.
 * Returns null if not found or invalid.
 */
export function loadUser() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    // Expect minimal schema
    if (typeof parsed.email !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * Clear any stored user from localStorage.
 */
export function clearUser() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
