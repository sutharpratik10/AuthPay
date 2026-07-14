import { pgTable, pgSchema, uuid, varchar, text, boolean, jsonb, timestamp, integer, foreignKey, unique, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const rbacSchema = pgSchema("rbac");


export const permissions = rbacSchema.table("permissions", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 100 }).notNull().unique(), // Policy name like "content:create", "user:manage"
	description: varchar('description', { length: 500 }),
	category: varchar('category', { length: 50 }), // user management, billing, content, etc.
	displayName: varchar('display_name', { length: 100 }),
	resource: varchar('resource', { length: 100 }), // The resource type: "content", "user", "billing"
	action: varchar('action', { length: 50 }), // The action: "create", "read", "update", "delete", "manage"
	isSystemManaged: boolean('is_system_managed').default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export const roles = rbacSchema.table("roles", {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 100 }).notNull().unique(),
	description: varchar('description', { length: 500 }),
	isDefault: boolean('is_default').default(false),
	isSystemManaged: boolean('is_system_managed').default(false),
	isSuperAdmin: boolean('is_super_admin').default(false),
	priority: integer('priority').default(0),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
	unique("roles_name_key").on(t.name)
]);


export const rolePermissions = rbacSchema.table("role_permissions", {
	id: uuid('id').defaultRandom().primaryKey(),
	roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
	permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
	unique("role_permissions_role_id_permission_id_unique").on(table.roleId, table.permissionId),
	foreignKey({
		columns: [table.roleId],
		foreignColumns: [roles.id],
		name: "role_permissions_role_id_roles_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.permissionId],
		foreignColumns: [permissions.id],
		name: "role_permissions_permission_id_permissions_id_fk"
	}).onDelete("cascade"),
]);


export const userRoles = rbacSchema.table("user_roles", {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
	assignedAt: timestamp('assigned_at').defaultNow().notNull(),
	assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }), // Track who assigned this role
}, (table) => [
	unique("user_roles_user_id_role_id_unique").on(table.userId, table.roleId)
]);


