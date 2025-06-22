import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';

/**
 * Resources table - defines protectable resources in the system
 */
export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // document, project, report, etc.
  path: varchar('path', { length: 255 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Resource Access Controls - defines access to resources
 */
export const resourceAccessControls = pgTable('resource_access_controls', {
  id: uuid('id').defaultRandom().primaryKey(),
  resourceId: uuid('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  roleId: uuid('role_id'), // Optional role ID for role-based permissions
  accessType: varchar('access_type', { length: 20 }).notNull(), // read, write, admin
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
});

/**
 * Resource versions - tracks changes to resources
 */
export const resourceVersions = pgTable('resource_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  resourceId: uuid('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  version: varchar('version', { length: 20 }).notNull(),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
});

/**
 * Resource comments - for collaboration on resources
 * Breaking circular reference by not directly referencing itself
 */
export const resourceComments = pgTable('resource_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  resourceId: uuid('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  // Using UUID without direct self-reference to fix TypeScript circular reference issue
  replyToCommentId: uuid('reply_to_comment_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isEdited: boolean('is_edited').default(false),
  isDeleted: boolean('is_deleted').default(false),
});

/**
 * Resource shares - tracks sharing outside of tenant
 */
export const resourceShares = pgTable('resource_shares', {
  id: uuid('id').defaultRandom().primaryKey(),
  resourceId: uuid('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id), // Who created the share
  email: varchar('email', { length: 255 }), // Recipient email if shared externally
  accessToken: varchar('access_token', { length: 255 }).notNull(),
  accessType: varchar('access_type', { length: 20 }).notNull(), // read, write, comment
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at'),
});

/**
 * Define relations for the resources table
 */
export const resourcesRelations = relations(resources, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [resources.tenantId],
    references: [tenants.id],
  }),
  accessControls: many(resourceAccessControls),
  versions: many(resourceVersions),
  comments: many(resourceComments),
  shares: many(resourceShares),
}));

/**
 * Define relations for the resource access controls table
 */
export const resourceAccessControlsRelations = relations(resourceAccessControls, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceAccessControls.resourceId],
    references: [resources.id],
  }),
  user: one(users, {
    fields: [resourceAccessControls.userId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [resourceAccessControls.createdByUserId],
    references: [users.id],
  }),
}));

/**
 * Define relations for the resource versions table
 */
export const resourceVersionsRelations = relations(resourceVersions, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceVersions.resourceId],
    references: [resources.id],
  }),
  createdBy: one(users, {
    fields: [resourceVersions.createdByUserId],
    references: [users.id],
  }),
}));

/**
 * Define relations for the resource comments table including self-relation
 * Using a function to break circular reference
 */
export const resourceCommentsRelations = relations(resourceComments, ({ one, many }) => {
  // Creating a separate constant for reply relation to break circular reference
  const baseRelations = {
    resource: one(resources, {
      fields: [resourceComments.resourceId],
      references: [resources.id],
    }),
    user: one(users, {
      fields: [resourceComments.userId], 
      references: [users.id],
    }),
  };

  // Adding self-reference relations separately to avoid TypeScript circular reference
  return {
    ...baseRelations,
    replyTo: one(resourceComments, {
      fields: [resourceComments.replyToCommentId],
      references: [resourceComments.id],
    }),
    replies: many(resourceComments, { relationName: 'comment_replies' }),
  };
});
