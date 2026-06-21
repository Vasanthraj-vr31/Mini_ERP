// Role → permission set map (mirrors backend RBAC seed)
// Used by can(module, action) — no network call needed after login.
const ROLE_PERMS = {
  'System Administrator': '*',   // wildcard — all permissions
  'Admin': '*',                  // legacy seed alias
  'Sales Administrator': new Set([
    'Sales:view','Sales:create','Sales:edit','Sales:delete','Sales:approve',
    'Product:view','Purchase:view','Manufacturing:view','Inventory:view',
    'Reports:view','Analytics:view','AuditLogs:view',
  ]),
  'Purchase Administrator': new Set([
    'Purchase:view','Purchase:create','Purchase:edit','Purchase:delete','Purchase:approve',
    'Product:view','Sales:view','Manufacturing:view','Inventory:view',
    'Reports:view','Analytics:view',
  ]),
  'Manufacturing Administrator': new Set([
    'Manufacturing:view','Manufacturing:create','Manufacturing:edit','Manufacturing:delete','Manufacturing:approve',
    'Product:view','Product:create','Product:edit',
    'Inventory:view','Inventory:create','Inventory:edit',
    'Sales:view','Purchase:view','Reports:view','Analytics:view',
  ]),
  'Inventory Manager': new Set([
    'Inventory:view','Inventory:create','Inventory:edit','Inventory:delete','Inventory:approve',
    'Product:view','Product:create','Product:edit',
    'Purchase:view','Purchase:create','Manufacturing:view','Reports:view','Analytics:view',
  ]),
  'Business Owner': new Set([
    'Sales:view','Purchase:view','Manufacturing:view','Product:view',
    'Inventory:view','Reports:view','Analytics:view','AuditLogs:view',
  ]),
  'Normal User': new Set([
    'Sales:view','Sales:create','Product:view',
    'Purchase:view', 'Purchase:create', 'Purchase:edit', 'Purchase:approve',
    'Manufacturing:view', 'Manufacturing:create', 'Manufacturing:edit', 'Manufacturing:approve', 
    'Inventory:view'
  ]),
}

export function can(role, module, action) {
  if (!role) return false
  const perms = ROLE_PERMS[role]
  if (!perms) return false
  if (perms === '*') return true
  return perms.has(`${module}:${action}`)
}

export function isAdmin(role) {
  return role === 'System Administrator' || role === 'Admin'
}

export function isCustomer(role) {
  return role === 'Normal User'
}
