import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { tenantUsers } from './users';

/**
 * Roles table - defines user roles within tenants
 */
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }),
  isDefault: boolean('is_default').default(false),
  isSystemManaged: boolean('is_system_managed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Permissions table - defines granular permissions
 */
export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: varchar('description', { length: 500 }),
  category: varchar('category', { length: 50 }), // user management, billing, etc.
  displayName: varchar('display_name', { length: 100 }),
  isSystemManaged: boolean('is_system_managed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Role Permissions - maps roles to permissions
 */
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * User Roles - maps tenant users to roles
 */
export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantUserId: uuid('tenant_user_id').notNull().references(() => tenantUsers.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Custom Role Permissions - for custom per-user permissions
 */
export const customUserPermissions = pgTable('custom_user_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantUserId: uuid('tenant_user_id').notNull().references(() => tenantUsers.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  granted: boolean('granted').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Permission Groups - for organizing permissions
 */
export const permissionGroups = pgTable('permission_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Permission Group Items - maps permissions to groups
 */
export const permissionGroupItems = pgTable('permission_group_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').notNull().references(() => permissionGroups.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Define relations for the roles table
 */
export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  permissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

/**
 * Define relations for the permissions table
 */
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  groupItems: many(permissionGroupItems),
}));

/**
 * Define relations for the role permissions table
 */
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

/**
 * Define relations for the user roles table
 */
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  tenantUser: one(tenantUsers, {
    fields: [userRoles.tenantUserId],
    references: [tenantUsers.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

/**
 * Define relations for the custom user permissions table
 */
export const customUserPermissionsRelations = relations(customUserPermissions, ({ one }) => ({
  tenantUser: one(tenantUsers, {
    fields: [customUserPermissions.tenantUserId],
    references: [tenantUsers.id],
  }),
  permission: one(permissions, {
    fields: [customUserPermissions.permissionId],
    references: [permissions.id],
  }),
}));
