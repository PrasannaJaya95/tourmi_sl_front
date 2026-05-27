/** Normalize role from API/localStorage (handles casing and spaces). */
export function normalizeUserRole(role) {
    if (!role || typeof role !== 'string') return '';
    return role.toUpperCase().replace(/\s+/g, '_');
}

export function isAdminOrSuperAdmin(role) {
    const r = normalizeUserRole(role);
    return r === 'ADMIN' || r === 'SUPER_ADMIN';
}
